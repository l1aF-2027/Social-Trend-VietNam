import os
from typing import Tuple
import json
from logger import setup_logger
import random
from datetime import datetime
from typing import Optional
import logging

logger = setup_logger(__name__, logging.DEBUG)

class Utils():
    @staticmethod
    def write_txt(path: str, data: str) -> None:
        try:
            with open(path, "w", encoding="utf-8") as file:
                file.write(data)
                logger.debug(f"Ghi nội dung vào {path} thành công")
        except Exception as e:
            logger.debug(f"Ghi nội dung vào {path} không thành công")
        
    @staticmethod
    def load_cookies(path):
        logger.debug("Tiến hành load cookies")
        try:
            with open(path, "r", encoding="utf-8") as file:
                return json.load(file)
            logger.debug(f"Load cookies thành công {path}")
        except Exception as e:
            logger.error(f"Lỗi khi load cookies {path} {e}")
            raise Exception("Lỗi khi load cookies", e)

    @staticmethod
    def check_and_add_api(json_path: str, data: Tuple[str, int]) -> None:
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as file:
                    json_data = json.load(file)
            except json.JSONDecodeError:
                json_data = {}
        else:
            json_data = {}

        key, value = data

        if key not in json_data.keys():
            json_data[key] = value
        else:
            if json_data[key] != value:
                json_data[key] = value
        try:
            with open(json_path, "w", encoding="utf-8") as file:
                json.dump(json_data, file, ensure_ascii=False, indent=4)
            
            logger.debug(f"Ghi facebook api vào log thành công {data}")
        except Exception as e:
            logger.error(f"Lỗi khi ghi facebook api vào log {data}")

    @staticmethod
    def write_json(json_path: str, data: dict) -> None:
        if not os.path.exists(os.path.dirname(json_path)):
            os.makedirs(os.path.dirname(json_path), exist_ok=True)
            logger.debug(f"Tạo thư mục {os.path.dirname(json_path)} thành công")
        try: 
            with open(json_path, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=4)
            logger.debug(f"Ghi json thành công {json_path}")
        except Exception as e:
            logger.error(f"Lỗi khi ghi json {json_path} {e}")
    
    @staticmethod
    def write_jsonl(jsonl_path: str, data: dict, mode: str = "a") -> None:
        if not os.path.exists(os.path.dirname(jsonl_path)):
            os.makedirs(os.path.dirname(jsonl_path), exist_ok=True)
            logger.debug(f"Tạo thư mục {os.path.dirname(jsonl_path)} thành công")
        try:
            with open(jsonl_path, mode=mode, encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False)
                file.write("\n")
                logger.debug(f"Ghi jsonl thành công {jsonl_path}")
        except Exception as e:
            logger.error(f"Lỗi khi ghi jsonl {jsonl_path} {e}")
    
    @staticmethod
    def load_json(json_path: str) -> dict:
        try:
            with open(json_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as e:
            logger.error(f"Lỗi khi load json {json_path} {e}")
            raise Exception("Lỗi khi load json", e)

    @staticmethod
    def del_json(json_path: str) -> None:
        try:
            os.remove(json_path)
        except Exception as e:
            logger.error(f"Lỗi khi xóa json {json_path} {e}")

    @staticmethod
    def file_exists(file_path: str) -> bool:
        return os.path.exists(file_path)

    @staticmethod
    def get_random_url(file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                urls = file.readlines()

            url = random.choice(urls).strip()
            return url
        except Exception as e:
            logger.error(f"Lỗi khi lấy url ngẫu nhiên {file_path} {e}")
            raise Exception("Lỗi khi lấy url ngẫu nhiên", e)

    def is_apis_in_source(json_path: str, api_names: list[str]) -> bool:
        try:
            if not os.path.exists(json_path):
                logger.warning(f"File {json_path} không tồn tại")
                return False

            api_sources = Utils.load_json(json_path)
            for api_name in api_names:
                if api_name not in api_sources.keys():
                    logger.warning(f"API {api_name} không tồn tại")
                    return False
                else:
                    logger.debug(f"API {api_name} tồn tại")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra api {json_path} {e}")

    @staticmethod
    def export_api2json(api_path: str, json_path: str, api_names: list[str]) -> None:
        try:
            if not os.path.exists(api_path):
                logger.warning(f"File {api_path} không tồn tại")
                return

            if not Utils.is_apis_in_source(api_path, api_names):
                logger.warning(f"Có API không tồn tại trong API SOURCE")
                return

            api_sources = Utils.load_json(api_path)
            api_json = dict()
            for api_name in api_names:
                api_json[api_name] = api_sources[api_name]
            
            Utils.write_json(json_path, api_json)
        except Exception as e:
            logger.error(f"Lỗi khi export api {api_path} {e}")

    @staticmethod
    def init_requests_variables(after_time: Optional[str] = None, before_time: Optional[str] = None) -> Tuple[dict, dict]:
        time_range = dict()
        if after_time:
            after_time = datetime.strptime(after_time.strip(), "%Y-%m-%d_%H-%M-%S") 
            time_range['after_time'] = int(after_time.timestamp())
        else:
            time_range['after_time'] = 0

        if before_time:
            before_time = datetime.strptime(before_time.strip(), "%Y-%m-%d_%H-%M-%S") 
            time_range['before_time'] = int(before_time.timestamp())
        else: 
            time_range['before_time'] = 9999999999999
        
        page_info = {
            "has_next_page": True,
            "end_cursor": ""
        }

        logger.debug(f"Khởi tạo TimeRange và PageInfo thành công")
        return time_range, page_info

    @staticmethod
    def n_post2n_iter(n_post: int) -> int:
        return n_post // 3

    @staticmethod
    def n_comment2n_iter(n_comment: int) -> int:
        return n_comment // 10

    @staticmethod
    def remove_file(file_path: str) -> None:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            logger.debug(f"Xoá file {file_path} thành công")
        except Exception as e:
            logger.debug(f"Xoá file {file_path} không thành công")