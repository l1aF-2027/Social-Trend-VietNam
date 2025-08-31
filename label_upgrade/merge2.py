import os
import json
from glob import glob

# Thư mục chứa các file
folder_path = "json/soft"

# Lấy danh sách các file theo pattern
files = sorted(glob(os.path.join(folder_path, "data_labeled_*.jsonl")))

all_data = []

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:  # bỏ qua dòng trống
                try:
                    obj = json.loads(line)
                    all_data.append(obj)
                except json.JSONDecodeError as e:
                    print(f"Lỗi parse JSON ở file {file}: {e}")

# Ghi thành một file JSON duy nhất (mảng các object)
output_file = "data_labeled_soft_llama.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print(f"Đã nối {len(files)} file thành công -> {output_file}")
