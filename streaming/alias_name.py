import os
import json
from unidecode import unidecode

input_path = "list_name_celeb.txt"
output_path = "celebrity_aliases.json"

with open(input_path, "r", encoding="utf-8") as f:
    names = [line.strip() for line in f if line.strip()]


def generate_aliases(name):
    variants = set()
    no_accents = unidecode(name)

    variants.update([
        name,
        name.lower(),
        name.upper(),
        no_accents,
        no_accents.lower(),
        no_accents.upper()
    ])

    if "-" in name:
        parts = name.split("-")
        for part in parts:
            variants.update(generate_aliases(part.strip()))
        variants.add(" ".join(parts))
        variants.add(" ".join(parts).lower())
        variants.add(" ".join(parts).upper())

    if " " in name:
        parts = name.split()
        initials = [p[0] for p in parts if p]

        if len(parts) > 2:
            # Viết tắt: N.T.T.T
            dot_format = ".".join(initials) + "."
            flat = "".join(initials)
            spaced = " ".join(initials)

            variants.update([
                dot_format, dot_format.lower(), dot_format.upper(),
                flat, flat.lower(), flat.upper(),
                spaced, spaced.lower(), spaced.upper()
            ])

            # Tên đệm + tên
            middle_last = " ".join(parts[-2:])
            variants.update([middle_last, middle_last.lower(), middle_last.upper()])

            # Viết tắt đệm + tên: T.Tiên
            ttien = f"{parts[-2][0]}.{parts[-1]}"
            variants.update([ttien, ttien.lower(), ttien.upper()])

        # In hoa toàn bộ cụm tên
        all_upper = " ".join([p.upper() for p in parts])
        all_lower = " ".join([p.lower() for p in parts])
        variants.update([all_upper, all_lower])

    variants.discard("")
    variants.discard(name)  # giữ bản gốc làm key, không là alias

    return sorted(variants)


alias_dict = {}
for nm in names:
    alias_dict[nm] = generate_aliases(nm)

with open(output_path, 'w', encoding='utf-8') as outf:
    json.dump(alias_dict, outf, ensure_ascii=False, indent=2)

print(f"Generated aliases for {len(alias_dict)} names and saved to {output_path}.")