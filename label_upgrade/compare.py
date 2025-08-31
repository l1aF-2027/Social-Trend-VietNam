import json

# Đường dẫn 2 file
file1 = "output2.json"
file2 = "data_merged.json"

# Load dữ liệu
with open(file1, "r", encoding="utf-8") as f:
    data1 = json.load(f)

with open(file2, "r", encoding="utf-8") as f:
    data2 = json.load(f)

# Hàm tạo "khóa" để ghép 2 object tương ứng
def make_key(obj):
    comment = obj.get("comment", {})
    return (
        obj.get("post_content", ""),
        obj.get("creation_time", ""),
        obj.get("post_url", ""),
        comment.get("comment_text", ""),
        tuple(comment.get("parent_comment_texts", []))  # fix: list -> tuple
    )

# Tạo dictionary cho file1 và file2
dict1 = {make_key(obj): obj for obj in data1}
dict2 = {make_key(obj): obj for obj in data2}

# Hàm kiểm tra bằng nhau (cho phép hoán đổi Aspect_1 <-> Aspect_2)
def compare_aspects(obj1, obj2):
    # Case 1: giữ nguyên
    if (obj1.get("Aspect_1") == obj2.get("Aspect_1") and
        obj1.get("Aspect_2") == obj2.get("Aspect_2") and
        obj1.get("Sentiment") == obj2.get("Sentiment")):
        return True
    
    # Case 2: hoán đổi Aspect_1 <-> Aspect_2
    if (obj1.get("Aspect_1") == obj2.get("Aspect_2") and
        obj1.get("Aspect_2") == obj2.get("Aspect_1") and
        obj1.get("Sentiment") == obj2.get("Sentiment")):
        return True
    
    return False

# So sánh
diffs = []
for key, obj1 in dict1.items():
    if key in dict2:
        obj2 = dict2[key]
        if not compare_aspects(obj1, obj2):
            diffs.append({
                "key": key,
                "file1": {
                    "Aspect_1": obj1.get("Aspect_1"),
                    "Aspect_2": obj1.get("Aspect_2"),
                    "Sentiment": obj1.get("Sentiment"),
                },
                "file2": {
                    "Aspect_1": obj2.get("Aspect_1"),
                    "Aspect_2": obj2.get("Aspect_2"),
                    "Sentiment": obj2.get("Sentiment"),
                }
            })

print("Tổng số object khác nhau:", len(diffs))
