import asyncio
import aiohttp
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import logging
import time
import random
from typing import List, Dict
import json
import os
from dataclasses import dataclass
from sqlalchemy.orm import Session
from ..app import SessionLocal, RateData, Hotel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class HotelRateResult:
    hotel_name: str
    source: str
    room_type: str
    rate: float
    availability: bool
    check_in: datetime
    check_out: datetime
    scraped_at: datetime

class BaseScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.driver = None
        self.session = None
        
    def setup_driver(self):
        """Setup Selenium WebDriver with proper configuration"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        return self.driver
    
    def setup_session(self):
        """Setup aiohttp session for faster requests"""
        self.session = aiohttp.ClientSession()
        return self.session
    
    async def close(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()
        if self.session:
            await self.session.close()

class BookingComScraper(BaseScraper):
    """Scraper for Booking.com"""
    
    def __init__(self, headless: bool = True):
        super().__init__(headless)
        self.base_url = "https://www.booking.com"
        
    def build_search_url(self, destination: str, check_in: datetime, check_out: datetime) -> str:
        """Build search URL for Booking.com"""
        checkin_str = check_in.strftime("%Y-%m-%d")
        checkout_str = check_out.strftime("%Y-%m-%d")
        
        return f"{self.base_url}/searchresults.html?ss={destination}&checkin={checkin_str}&checkout={checkout_str}&group_adults=1&no_rooms=1"
    
    async def scrape_hotel_rates(self, hotel_name: str, destination: str, 
                                check_in: datetime, check_out: datetime) -> List[HotelRateResult]:
        """Scrape rates for a specific hotel"""
        results = []
        
        try:
            driver = self.setup_driver()
            url = self.build_search_url(destination, check_in, check_out)
            
            logger.info(f"Scraping Booking.com for {hotel_name} in {destination}")
            driver.get(url)
            
            # Wait for results to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='property-card']"))
            )
            
            # Random delay to avoid detection
            time.sleep(random.uniform(2, 5))
            
            # Find hotel in results
            hotel_cards = driver.find_elements(By.CSS_SELECTOR, "[data-testid='property-card']")
            
            for card in hotel_cards:
                try:
                    # Extract hotel name
                    name_element = card.find_element(By.CSS_SELECTOR, "[data-testid='title']")
                    scraped_hotel_name = name_element.text.strip()
                    
                    # Check if this matches our target hotel (fuzzy match)
                    if self._is_hotel_match(hotel_name, scraped_hotel_name):
                        # Extract rate information
                        rate_element = card.find_element(By.CSS_SELECTOR, "[data-testid='price-and-discounted-price']")
                        rate_text = rate_element.text
                        
                        # Parse rate (assuming format like "$245")
                        rate = self._parse_rate(rate_text)
                        
                        if rate:
                            result = HotelRateResult(
                                hotel_name=scraped_hotel_name,
                                source="Booking.com",
                                room_type="Standard Room",  # Default for now
                                rate=rate,
                                availability=True,
                                check_in=check_in,
                                check_out=check_out,
                                scraped_at=datetime.utcnow()
                            )
                            results.append(result)
                            logger.info(f"Found rate for {scraped_hotel_name}: ${rate}")
                            break
                            
                except Exception as e:
                    logger.warning(f"Error extracting data from hotel card: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping Booking.com: {e}")
        finally:
            if driver:
                driver.quit()
                
        return results
    
    def _is_hotel_match(self, target: str, scraped: str) -> bool:
        """Check if scraped hotel name matches target hotel"""
        target_words = set(target.lower().split())
        scraped_words = set(scraped.lower().split())
        
        # Simple fuzzy matching - at least 60% word overlap
        intersection = target_words.intersection(scraped_words)
        return len(intersection) / len(target_words) >= 0.6
    
    def _parse_rate(self, rate_text: str) -> float:
        """Parse rate from text like '$245' or 'US$245'"""
        import re
        matches = re.findall(r'[\d,]+', rate_text.replace(',', ''))
        if matches:
            try:
                return float(matches[0])
            except ValueError:
                return None
        return None

class ExpediaScraper(BaseScraper):
    """Scraper for Expedia"""
    
    def __init__(self, headless: bool = True):
        super().__init__(headless)
        self.base_url = "https://www.expedia.com"
    
    async def scrape_hotel_rates(self, hotel_name: str, destination: str,
                                check_in: datetime, check_out: datetime) -> List[HotelRateResult]:
        """Scrape rates for a specific hotel from Expedia"""
        results = []
        
        try:
            driver = self.setup_driver()
            
            # Build Expedia search URL
            checkin_str = check_in.strftime("%m/%d/%Y")
            checkout_str = check_out.strftime("%m/%d/%Y")
            
            url = f"{self.base_url}/Hotels-Search?destination={destination}&startDate={checkin_str}&endDate={checkout_str}"
            
            logger.info(f"Scraping Expedia for {hotel_name} in {destination}")
            driver.get(url)
            
            # Wait for results
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-stid='section-results']"))
            )
            
            time.sleep(random.uniform(3, 6))
            
            # Find hotel listings
            hotel_cards = driver.find_elements(By.CSS_SELECTOR, "[data-stid='lodging-card-responsive']")
            
            for card in hotel_cards:
                try:
                    # Extract hotel name
                    name_element = card.find_element(By.CSS_SELECTOR, "h3")
                    scraped_hotel_name = name_element.text.strip()
                    
                    if self._is_hotel_match(hotel_name, scraped_hotel_name):
                        # Extract rate
                        rate_element = card.find_element(By.CSS_SELECTOR, "[data-stid='price-display-field']")
                        rate_text = rate_element.text
                        
                        rate = self._parse_rate(rate_text)
                        
                        if rate:
                            result = HotelRateResult(
                                hotel_name=scraped_hotel_name,
                                source="Expedia",
                                room_type="Standard Room",
                                rate=rate,
                                availability=True,
                                check_in=check_in,
                                check_out=check_out,
                                scraped_at=datetime.utcnow()
                            )
                            results.append(result)
                            logger.info(f"Found Expedia rate for {scraped_hotel_name}: ${rate}")
                            break
                            
                except Exception as e:
                    logger.warning(f"Error extracting Expedia data: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error scraping Expedia: {e}")
        finally:
            if driver:
                driver.quit()
                
        return results
    
    def _is_hotel_match(self, target: str, scraped: str) -> bool:
        """Check if scraped hotel name matches target hotel"""
        target_words = set(target.lower().split())
        scraped_words = set(scraped.lower().split())
        intersection = target_words.intersection(scraped_words)
        return len(intersection) / len(target_words) >= 0.6
    
    def _parse_rate(self, rate_text: str) -> float:
        """Parse rate from Expedia format"""
        import re
        matches = re.findall(r'[\d,]+', rate_text.replace(',', ''))
        if matches:
            try:
                return float(matches[0])
            except ValueError:
                return None
        return None

class RateScrapingService:
    """Main service for coordinating rate scraping across multiple OTAs"""
    
    def __init__(self):
        self.scrapers = {
            'booking': BookingComScraper(),
            'expedia': ExpediaScraper(),
        }
    
    async def scrape_hotel_rates(self, hotel_name: str, destination: str,
                                check_in: datetime = None, check_out: datetime = None) -> List[HotelRateResult]:
        """Scrape rates for a hotel across all configured OTAs"""
        
        if not check_in:
            check_in = datetime.now() + timedelta(days=1)
        if not check_out:
            check_out = check_in + timedelta(days=1)
            
        all_results = []
        
        # Run scrapers concurrently
        tasks = []
        for scraper_name, scraper in self.scrapers.items():
            task = scraper.scrape_hotel_rates(hotel_name, destination, check_in, check_out)
            tasks.append(task)
        
        # Wait for all scrapers to complete
        scraper_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for results in scraper_results:
            if isinstance(results, list):
                all_results.extend(results)
            elif isinstance(results, Exception):
                logger.error(f"Scraper failed: {results}")
        
        return all_results
    
    async def save_rates_to_db(self, results: List[HotelRateResult], hotel_id: int):
        """Save scraped rates to database"""
        db = SessionLocal()
        try:
            for result in results:
                db_rate = RateData(
                    hotel_id=hotel_id,
                    date=result.check_in,
                    source=result.source,
                    room_type=result.room_type,
                    rate=result.rate,
                    availability=result.availability,
                    scraped_at=result.scraped_at
                )
                db.add(db_rate)
            
            db.commit()
            logger.info(f"Saved {len(results)} rate records to database")
            
        except Exception as e:
            logger.error(f"Error saving rates to database: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def scrape_and_save_hotel(self, hotel_id: int, hotel_name: str, destination: str):
        """Complete workflow: scrape rates and save to database"""
        try:
            logger.info(f"Starting rate scraping for hotel: {hotel_name}")
            
            # Scrape rates
            results = await self.scrape_hotel_rates(hotel_name, destination)
            
            if results:
                # Save to database
                await self.save_rates_to_db(results, hotel_id)
                logger.info(f"Successfully scraped and saved {len(results)} rates for {hotel_name}")
            else:
                logger.warning(f"No rates found for {hotel_name}")
                
        except Exception as e:
            logger.error(f"Error in scraping workflow for {hotel_name}: {e}")
    
    async def close_all_scrapers(self):
        """Cleanup all scrapers"""
        for scraper in self.scrapers.values():
            await scraper.close()

# Background task function for scheduled scraping
async def scheduled_rate_scraping():
    """Background task that runs periodically to scrape rates"""
    service = RateScrapingService()
    db = SessionLocal()
    
    try:
        # Get all hotels that need scraping
        hotels = db.query(Hotel).filter(Hotel.is_own == False).all()  # Scrape competitor hotels
        
        for hotel in hotels:
            try:
                await service.scrape_and_save_hotel(
                    hotel.id, 
                    hotel.name, 
                    hotel.location
                )
                
                # Add delay between hotels to avoid overloading
                await asyncio.sleep(random.uniform(30, 60))
                
            except Exception as e:
                logger.error(f"Error scraping hotel {hotel.name}: {e}")
                continue
                
    except Exception as e:
        logger.error(f"Error in scheduled scraping: {e}")
    finally:
        await service.close_all_scrapers()
        db.close()

if __name__ == "__main__":
    # Test the scraper
    async def test_scraper():
        service = RateScrapingService()
        
        check_in = datetime.now() + timedelta(days=1)
        check_out = check_in + timedelta(days=1)
        
        results = await service.scrape_hotel_rates(
            "Grand Plaza Hotel", 
            "New York", 
            check_in, 
            check_out
        )
        
        print(f"Found {len(results)} rate results:")
        for result in results:
            print(f"  {result.source}: ${result.rate} for {result.hotel_name}")
        
        await service.close_all_scrapers()
    
    asyncio.run(test_scraper()) 