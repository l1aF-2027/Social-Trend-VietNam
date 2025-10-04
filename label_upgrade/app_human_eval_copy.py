import streamlit as st
import json
import os

ASPECTS = ["Health", "Fashion", "Sport", "Food", "Art", "Law", "Other"]
SENTIMENTS = ["positive", "negative", "neutral"]

file1 = "data_labeled_soft_cleaned.json"
file2 = "output.json"
output_file = "data_merged.json"  # dùng chung file với bản forward

def make_key(obj):
    comment = obj.get("comment", {})
    return (
        obj.get("post_content", ""),
        obj.get("creation_time", ""),
        obj.get("post_url", ""),
        comment.get("comment_text", ""),
        tuple(comment.get("parent_comment_texts", []))
    )

@st.cache_data
def load_data():
    with open(file1, "r", encoding="utf-8") as f:
        data1 = json.load(f)
    with open(file2, "r", encoding="utf-8") as f:
        data2 = json.load(f)
    dict1 = {make_key(obj): obj for obj in data1}
    dict2 = {make_key(obj): obj for obj in data2}
    return dict1, dict2

def load_existing_merged_data():
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return []
    return []

def find_start_index(keys, existing_data):
    if not existing_data:
        return 0
    processed_keys = set(make_key(obj) for obj in existing_data)
    for i, key in enumerate(keys):
        if key not in processed_keys:
            return i
    return len(keys)

def ensure_list_sentiment(obj):
    if not isinstance(obj.get("Sentiment"), list):
        obj = obj.copy()
        obj["Sentiment"] = [obj["Sentiment"]]
    return obj

def save_obj(obj, saved_objs):
    obj = ensure_list_sentiment(obj)
    if obj.get("Aspect_2") in [None, "", "null"]:
        obj["Aspect_2"] = None
        if len(obj["Sentiment"]) > 1:
            obj["Sentiment"] = [obj["Sentiment"][0]]
    saved_objs.append(obj)

def main():
    st.title("So sánh & Gộp Nhãn Dữ Liệu (Phiên bản chạy ngược)")

    dict1, dict2 = load_data()
    keys = list(dict1.keys())[::-1]  # đảo ngược để làm từ cuối về đầu
    
    existing_data = load_existing_merged_data()
    start_idx = find_start_index(keys, existing_data)
    
    if "saved_objs" not in st.session_state:
        st.session_state["saved_objs"] = existing_data.copy()
    if "idx" not in st.session_state:
        st.session_state["idx"] = start_idx

    idx = st.session_state["idx"]

    st.sidebar.markdown("### 📊 Thống kê")
    st.sidebar.write(f"**Tổng số records:** {len(keys)}")
    st.sidebar.write(f"**Đã xử lý:** {len(st.session_state['saved_objs'])}")
    st.sidebar.write(f"**Còn lại:** {len(keys) - idx}")
    st.sidebar.write(f"**Tiến độ:** {idx}/{len(keys)} ({idx/len(keys)*100:.1f}%)")

    if st.sidebar.button("🔄 Reset từ đầu (chỉ bản ngược)"):
        st.session_state["saved_objs"] = []
        st.session_state["idx"] = 0
        if os.path.exists(output_file):
            os.remove(output_file)
        st.rerun()

    while idx < len(keys):
        key = keys[idx]
        if key not in dict2:
            idx += 1
            st.session_state["idx"] = idx
            continue
            
        obj1 = dict1[key]
        obj2 = dict2[key]

        # Kiểm tra trùng khớp bình thường
        same_direct = (
            obj1.get("Aspect_1") == obj2.get("Aspect_1") and
            obj1.get("Aspect_2") == obj2.get("Aspect_2") and
            obj1.get("Sentiment") == obj2.get("Sentiment")
        )

        # Kiểm tra trùng khớp khi hoán đổi Aspect_1 <-> Aspect_2 và Sentiment đi kèm
        same_swapped = False
        sent1 = obj1.get("Sentiment")
        sent2 = obj2.get("Sentiment")
        if isinstance(sent1, list) and isinstance(sent2, list) and len(sent1) == 2 and len(sent2) == 2:
            same_swapped = (
                obj1.get("Aspect_1") == obj2.get("Aspect_2") and
                obj1.get("Aspect_2") == obj2.get("Aspect_1") and
                sent1[0] == sent2[1] and
                sent1[1] == sent2[0]
            )

        if same_direct or same_swapped:
            save_obj(obj1, st.session_state["saved_objs"])
            idx += 1
            st.session_state["idx"] = idx
            # Lưu file sau mỗi lần xử lý
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(st.session_state["saved_objs"], f, ensure_ascii=False, indent=2)
            continue

        # Hiển thị tiến độ (đếm cả trùng và không trùng)
        st.info(f"🔄 Đang xử lý record {idx + 1} / {len(keys)} (Đã lưu: {len(st.session_state['saved_objs'])})")

        st.subheader("🔍 Phát hiện khác nhau")
        
        # Hiển thị key
        key_fields = ["post_content", "creation_time", "post_url", "comment_text", "parent_comment_texts"]
        with st.expander("📋 Chi tiết Key", expanded=False):
            for field, value in zip(key_fields, key):
                st.write(f"**{field}**: {str(value)[:200]}{'...' if len(str(value)) > 200 else ''}")
        
        # So sánh 2 file
        col1, col2 = st.columns(2)
        with col1:
            st.write("**📁 File 1**")
            st.json({
                "Aspect_1": obj1.get("Aspect_1"),
                "Aspect_2": obj1.get("Aspect_2"),
                "Sentiment": obj1.get("Sentiment"),
            })
        with col2:
            st.write("**📁 File 2**")
            st.json({
                "Aspect_1": obj2.get("Aspect_1"),
                "Aspect_2": obj2.get("Aspect_2"),
                "Sentiment": obj2.get("Sentiment"),
            })

        choice = st.radio("Chọn kết quả", ["File1", "File2", "Nhập tay"], key=f"choice_{idx}")

        if choice == "File1":
            if st.button("💾 Lưu lựa chọn File1", key=f"save1_{idx}"):
                save_obj(obj1, st.session_state["saved_objs"])
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(st.session_state["saved_objs"], f, ensure_ascii=False, indent=2)
                st.session_state["idx"] = idx + 1
                st.rerun()
                
        elif choice == "File2":
            if st.button("💾 Lưu lựa chọn File2", key=f"save2_{idx}"):
                save_obj(obj2, st.session_state["saved_objs"])
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(st.session_state["saved_objs"], f, ensure_ascii=False, indent=2)
                st.session_state["idx"] = idx + 1
                st.rerun()
                
        else:  # Nhập tay
            st.subheader("✏️ Nhập thông tin thủ công")
            aspect_1 = st.selectbox("Aspect 1", ASPECTS, 
                                   index=ASPECTS.index(obj1.get("Aspect_1", "Other")), 
                                   key=f"aspect1_{idx}")
            
            aspect2_val = obj1.get("Aspect_2")
            if aspect2_val in [None, "", "null"]:
                aspect2_index = 0
            elif aspect2_val in ASPECTS:
                aspect2_index = ASPECTS.index(aspect2_val) + 1
            else:
                aspect2_index = 0
                
            aspect_2 = st.selectbox(
                "Aspect 2 (nếu không có chọn 'None')",
                ["None"] + ASPECTS,
                index=aspect2_index,
                key=f"aspect2_{idx}"
            )
            
            sentiment_1 = st.selectbox("Sentiment 1", SENTIMENTS, index=0, key=f"sent1_{idx}")
            sentiment_2 = None
            if aspect_2 != "None":
                sentiment_2 = st.selectbox("Sentiment 2", SENTIMENTS, index=0, key=f"sent2_{idx}")
                
            if st.button("💾 Lưu lựa chọn thủ công", key=f"manual_save_{idx}"):
                new_obj = obj1.copy()
                new_obj["Aspect_1"] = aspect_1
                new_obj["Aspect_2"] = None if aspect_2 == "None" else aspect_2
                if sentiment_2 is not None:
                    new_obj["Sentiment"] = [sentiment_1, sentiment_2]
                else:
                    new_obj["Sentiment"] = [sentiment_1]
                save_obj(new_obj, st.session_state["saved_objs"])
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(st.session_state["saved_objs"], f, ensure_ascii=False, indent=2)
                st.session_state["idx"] = idx + 1
                st.rerun()
        break
    else:
        # Hoàn thành
        st.success("✅ Merge hoàn tất!")
        st.balloons()
        st.write(f"📊 **Tổng cộng đã xử lý:** {len(st.session_state['saved_objs'])} records")
        
        if st.button("💾 Lưu kết quả cuối cùng"):
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(st.session_state["saved_objs"], f, ensure_ascii=False, indent=2)
            st.success(f"✅ Đã lưu kết quả vào {output_file}")

if __name__ == "__main__":
    main()
