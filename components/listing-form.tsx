"use client";

import type { User } from "@supabase/supabase-js";
import { categories, conditionOptions } from "@/lib/categories";
import { supabase } from "@/lib/supabase";

type ListingFormProps = {
  user: User | null;
  onCreated: () => void;
};

export function ListingForm({ user, onCreated }: ListingFormProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !supabase) {
      window.alert("請先登入再刊登商品。");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const conditionScore = Number(formData.get("condition_score"));
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const conditionLabel =
      conditionOptions.find((option) => Number(option.value) === conditionScore)?.label ||
      "未標示";
    const imageFile = formData.get("image_file");
    let imageUrl = String(formData.get("image_url") || "").trim();

    if (title.length < 2 || title.length > 120) {
      window.alert("商品名稱需要 2 到 120 個字。");
      return;
    }

    if (description.length < 5 || description.length > 2000) {
      window.alert("詳細簡介需要 5 到 2000 個字，請多補一點商品狀況。");
      return;
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      const extension = imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const upload = await supabase.storage.from("listing-photos").upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false
      });

      if (upload.error) {
        window.alert(upload.error.message);
        return;
      }

      const publicUrl = supabase.storage.from("listing-photos").getPublicUrl(path);
      imageUrl = publicUrl.data.publicUrl;
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title,
      category: formData.get("category"),
      price: Number(formData.get("price")),
      condition_score: conditionScore,
      condition_label: conditionLabel,
      description,
      discord_id: String(formData.get("discord_id") || "").trim() || null,
      checkout_url: String(formData.get("checkout_url") || "").trim() || null,
      image_url: imageUrl || null
    });

    if (error) {
      window.alert(error.message);
      return;
    }

    form.reset();
    onCreated();
  }

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <label>
        <span>商品名稱</span>
        <input name="title" required minLength={2} maxLength={120} placeholder="例如：小鱷魚70 深綠色套件" />
      </label>

      <div className="form-row">
        <label>
          <span>分類</span>
          <select name="category" required>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>價格 NT$</span>
          <input name="price" type="number" min="0" required placeholder="6800" />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span>使用狀況</span>
          <select name="condition_score" required>
            {conditionOptions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Discord ID</span>
          <input name="discord_id" placeholder="blackjerry012" />
        </label>
      </div>

      <label>
        <span>賣貨便 / 下單連結</span>
        <input name="checkout_url" type="url" placeholder="https://myship.7-11.com.tw/..." />
      </label>

      <label>
        <span>照片網址</span>
        <input name="image_url" type="url" placeholder="也可以直接貼圖片網址" />
      </label>

      <label>
        <span>上傳照片</span>
        <input name="image_file" type="file" accept="image/*" />
      </label>

      <label>
        <span>詳細簡介</span>
        <textarea
          name="description"
          required
          minLength={5}
          maxLength={2000}
          rows={5}
          placeholder="說明配列、外觀瑕疵、含哪些東西、是否已調校、聲音或手感特色..."
        />
      </label>

      <button className="submit-button" type="submit">
        {user ? "送出刊登" : "登入後才能刊登"}
      </button>
    </form>
  );
}
