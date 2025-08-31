import json

# Đường dẫn file
input_file = "json\\nvidia_results\data_labeled_nvidia.json"
output_file = "output2.json"

# Load dữ liệu
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Duyệt qua từng object
for obj in data:
    # Nếu Aspect_2 là None thì gán thành string "null"
    if obj.get("Aspect_2") is None:
        obj["Aspect_2"] = "null"

        # Với Sentiment: thêm một phần tử "null"
        if "Sentiment" in obj:
            obj["Sentiment"].append("null")
        else:
            obj["Sentiment"] = ["null"]

# Ghi ra file mới
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ Đã xử lý và lưu vào {output_file}")
