import logging
from logging import Logger
import os
from datetime import datetime

def setup_logger(name: str, level: int = logging.INFO) -> Logger:
    # Create logs directory if not exists
    current_dir = os.path.dirname(os.path.abspath(__file__))
    logs_dir = os.path.join(current_dir, 'logs')
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir, exist_ok=True)
    
    # Setup logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Prevent logging to console
    logger.propagate = False

    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create file handler
    log_file = os.path.join(logs_dir, f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log")
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(level)

    # Set formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)

    # Add handler to logger
    logger.addHandler(file_handler)

    return logger