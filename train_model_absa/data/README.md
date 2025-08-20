# 📂 Dataset

## Folder Structure

```bash
├── 🖼️ image/                       # Folder containing images
├── 📄 data_labeled_soft_cleaned.json  # Cleaned & labeled dataset
├── 📄 image_descriptions.jsonl        # Raw image descriptions
└── 📖 README.md                        # Project documentation
```

## Data Structure (`data_labeled_soft_cleaned.json`)

Each entry in the file is a JSON object with the following fields:

| Field                | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `post_content`       | Main content of the post                                                 |
| `image_paths`        | List of attached image paths                                             |
| `image_descriptions` | List of image descriptions (objects with `path` and `image_description`) |
| `creation_time`      | Post creation time (Unix timestamp)                                      |
| `total_reactions`    | Total reactions (likes, hearts, etc.)                                    |
| `share_count`        | Number of shares                                                         |
| `comment_count`      | Number of comments                                                       |
| `post_url`           | Direct link to the post                                                  |

### Comment Field (`comment`)

```json
"comment": {
  "comment_text": "Comment content",
  "comment_images": ["Images in the comment (if any)"],
  "comment_image_descriptions": ["Descriptions of comment images"],
  "parent_comment_texts": ["Parent comment text (if this is a reply)"],
  "parent_comment_images": ["Images in the parent comment"],
  "parent_comment_image_descriptions": ["Descriptions of parent comment images"]
}
```

### Classification & Sentiment Labels Field

| Field       | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `Aspect_1`  | Level 1 classification category (Health, Fashion, Sport, Food, Art, Law, Other, null)         |
| `Aspect_2`  | Level 2 classification category (same set as above)                                           |
| `Sentiment` | List of sentiment labels corresponding to the two aspects (`positive`, `negative`, `neutral`, `null`) |
| `Persons`   | List of person names mentioned in the post                                                    |


## Label Distribution
### Aspect distribution

* Class 'Art': **579** (4.85%)
* Class 'Fashion': **344** (2.88%)
* Class 'Food': **809** (6.77%)
* Class 'Health': **1894** (15.86%)
* Class 'Law': **2399** (20.09%)
* Class 'Other': **3294** (27.58%)
* Class 'Sport': **624** (5.22%)
* Class 'null: **2001** (16.75%)

### Sentiment distribution

* Class 'negative': **6488** (54.32%)
* Class 'neutral: **885** (7.41%)
* Class 'null': **2001** (16.75%)
* Class 'positive': **2570** (21.52%)

## Notes

* All image paths are stored as relative paths under the `image/` directory.
* `image_descriptions.jsonl` contains raw, unprocessed image descriptions.
