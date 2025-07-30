import json
import os

input_path = "data/json/posts_K14vn.json"
output_path = input_path.replace("posts_K14vn.json", "posts_K14vn_final_converted.json")

if not os.path.exists(output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

def get_image_descriptions(image_paths):
    # Placeholder, bạn sẽ gọi Gemini API để sinh description cho từng ảnh
    return [{"path": path, "image_description": ""} for path in (image_paths or [])]

def process_comment(comment, parent_texts=None, parent_images=None):
    if parent_texts is None:
        parent_texts = []
    if parent_images is None:
        parent_images = []

    # Xử lý image_paths và image_description cho comment
    comment_images = [comment["image"]] if comment.get("image") else []
    comment_image_descriptions = get_image_descriptions(comment_images)

    # Xử lý image_description cho parent images
    parent_image_descriptions = [{"path": img, "image_description": ""} for img in parent_images]

    # Data point cho comment hiện tại
    comment_datapoint = {
        "Persons": [],
        "Aspect_1": "",
        "Aspect_2": "",
        "Sentiment": "",
        "comment_text": comment.get("text"),
        "comment_images": comment_images,
        "comment_image_descriptions": comment_image_descriptions,
        "parent_comment_texts": parent_texts,
        "parent_comment_images": parent_images,
        "parent_comment_image_descriptions": parent_image_descriptions,
    }

    # Đệ quy cho comment con, truyền mảng cha tăng dần
    feedback_info = comment.get("feedback_info", {})
    children = []
    for child in feedback_info.get("comments", []):
        children.extend(process_comment(
            child,
            parent_texts + [comment.get("text")],
            parent_images + comment_images
        ))
    return [comment_datapoint] + children

with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

output = []

for post in data:
    post_images = post.get("image_paths", [])
    post_image_descriptions = get_image_descriptions(post_images)

    post_dict = {
        "post_content": post.get("post_content"),
        "image_paths": post_images,
        "image_descriptions": post_image_descriptions,
        "creation_time": post.get("creation_time"),
        "total_reactions": post.get("total_reactions"),
        "share_count": post.get("share_count"),
        "comment_count": post.get("comment_count"),
        "post_url": post.get("post_url"),
        "comments": []
    }
    comments = post.get("comments", {}).get("comments", [])
    for comment in comments:
        post_dict["comments"].extend(process_comment(comment))
    output.append(post_dict)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Đã chuyển đổi xong, lưu tại {output_path}")