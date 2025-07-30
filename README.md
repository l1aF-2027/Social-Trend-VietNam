# 🚀 Social Trend VietNam 

An open-source platform to collect, analyze, and visualize social media trends in Vietnam, with a dedicated repo for training an ABSA model (aspect‑based sentiment analysis).


## 📂 Repository Structure & Roles

```
Social‑Trend‑VietNam/
├── crawl/
├── frontend/
├── streaming/
└── train_model_absa/
```

### 1. **crawl/**

* Platform-specific crawlers (Facebook, TikTok, YouTube, Zalo, forums, news).
* Supports API ingestion and web scraping.
* Scheduled via cron / scheduler jobs to collect raw posts, metadata, comments.

### 2. **streaming/**

* Real-time data ingestion & message queuing (e.g. Kafka, RabbitMQ).
* Normalizes, enriches, and routes stream data to downstream components for processing and dashboard updates.

### 3. **train\_model\_absa/**

* Responsible for building and fine-tuning an ABSA model to perform aspect‑based sentiment analysis.
* Implements tasks such as Aspect Term Extraction (ATE), Opinion Term Extraction (OTE), Aspect Sentiment Classification (ASC), and Aspect‑Opinion‑Sentiment Triplet Extraction (ASTE) using transformer-based architectures like BERT + graph convolutional enhancements ([Nature][1]).
* Could adopt modular frameworks like PyABSA for reproducible training across multiple datasets and tasks ([arXiv][2]).
* Parses data streams, assigns sentiment polarity per aspect, outputs labels to storage or streaming pipelines.

### 4. **frontend/**

* UI dashboard (built in React, Vue or similar) to display:

  * Trending topics / keywords.
  * Sentiment per aspect (from ABSA model).
  * Time-series graphs (trend momentum, heatmaps).
  * Platform breakdown (Facebook vs TikTok vs Forums, etc.).
* Communicates with backend APIs fed by streaming and ABSA outputs.

## 🧠 Workflow Overview

1. **Crawl**: Platform-specific scripts fetch raw data periodically.
2. **Stream**: Collected data enters the streaming pipeline where messages are normalized and pushed.
3. **Train\_model\_absa**: Streams are classified by aspect & sentiment; results output in real time or batch.
4. **Frontend**: Visualizes trends and sentiment insights dynamically.

This modular architecture supports scalability and easier maintenance. For example, you can update the ABSA model independently from the crawler or frontend.

---

## 🔍 Why ABSA?

Aspect‑based sentiment analysis (ABSA) enables fine‑grained sentiment detection—identifying opinions associated with specific aspects rather than general sentiment ([Nature][1], [arXiv][3]). Modern approaches leverage transformers (BERT, RoBERTa) and graph neural network enhancements to handle tasks such as ATE, ASC, and triplet extraction with high accuracy ([Nature][1]).
The repository's **train\_model\_absa** component can implement pipelines based on frameworks like PyABSA that support multiple datasets and models in a modular fashion ([arXiv][2]).

## 📌 Use Cases

* Real-time detection of social media topics and emerging buzzwords in Vietnam.
* Sentiment breakdown per aspect (e.g. product feature, social topic).
* Marketing teams, brands, and researchers can gain insights into public opinions on specific aspects of campaigns or content.