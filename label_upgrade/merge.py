import os
import json
from glob import glob

merged_data = []

file_list = sorted(glob("json/soft/data_part_*.json"))

for file in file_list:
    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)
        if isinstance(data, list):
            merged_data.extend(data)
        else:
            merged_data.append(data)

with open("data_labeled_soft_llama.json", "w", encoding="utf-8") as f:
    json.dump(merged_data, f, ensure_ascii=False, indent=4)
    
print(f"Merged {len(file_list)} files into data_labeled_soft_llama.json")