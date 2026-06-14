"use client";

import type { User } from "@supabase/supabase-js";
import { categories, conditionOptions } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

const maxImageSizeMb = 3;
const maxImageSizeBytes = maxImageSizeMb * 1024 * 1024;
const listingInviteCode = process.env.NEXT_PUBLIC_LISTING_INVITE_CODE;

type ListingFormProps = {
  editingListing?: Listing | null;
  user: User | null;
  onCancelEdit?: () => void;
  onSaved: () => void;
};

export function ListingForm({ editingListing, user, onCancelEdit, onSaved }: ListingFormProps) {
  const isEditing = Boolean(editingListing);

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
    const inviteCode = String(formData.get("invite_code") || "").trim();
    const checkoutUrl = String(formData.get("checkout_url") || "").trim();
    const conditionLabel =
      conditionOptions.find((option) => Number(option.value) === conditionScore)?.label ||
      "未標示";
    const imageFile = formData.get("image_file");
    let imageUrl = String(formData.get("image_url") || "").trim();

    if (!isEditing && listingInviteCode && inviteCode !== listingInviteCode) {
      window.alert("邀請碼不正確，請向群組管理員確認。");
      return;
    }

    if (title.length < 2 || title.length > 120) {
      window.alert("商品名稱需要 2 到 120 個字。");
      return;
    }

    if (description.length < 5 || description.length > 2000) {
      window.alert("詳細簡介需要 5 到 2000 個字，請多補一點商品狀況。");
      return;
    }

    if (checkoutUrl && !isAllowedCheckoutUrl(checkoutUrl)) {
      window.alert("下單連結目前只允許賣貨便網址：https://myship.7-11.com.tw/...");
      return;
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      if (!imageFile.type.startsWith("image/")) {
        window.alert("只能上傳圖片檔。");
        return;
      }

      if (imageFile.size > maxImageSizeBytes) {
        window.alert(`圖片不能超過 ${maxImageSizeMb}MB，請先壓縮後再上傳。`);
        return;
      }

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

    const payload = {
      title,
      category: formData.get("category"),
      price: Number(formData.get("price")),
      condition_score: conditionScore,
      condition_label: conditionLabel,
      description,
      discord_id: String(formData.get("discord_id") || "").trim() || null,
      checkout_url: checkoutUrl || null,
      image_url: imageUrl || editingListing?.image_url || null
    };

    const request = isEditing
      ? supabase.from("listings").update(payload).eq("id", editingListing!.id)
      : supabase.from("listings").insert({
          ...payload,
          user_id: user.id
        });

    const { error } = await request;

    if (error) {
      window.alert(error.message);
      return;
    }

    form.reset();
    onSaved();
  }

  return (
    <form className="listing-form" key={editingListing?.id || "new-listing"} onSubmit={handleSubmit}>
      {isEditing ? (
        <div className="form-notice">
          <strong>正在編輯刊登</strong>
          <span>修改錯字、價格、說明或照片後按下「儲存修改」。</span>
        </div>
      ) : (
        <label>
          <span>刊登邀請碼</span>
          <input
            name="invite_code"
            required={Boolean(listingInviteCode)}
            placeholder="向 DC 群管理員索取"
          />
        </label>
      )}

      <label>
        <span>商品名稱</span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder="例如：小鱷魚70 深綠色套件"
          defaultValue={editingListing?.title || ""}
        />
      </label>

      <div className="form-row">
        <label>
          <span>分類</span>
          <select name="category" required defaultValue={editingListing?.category || "keyboard"}>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>價格 NT$</span>
          <input
            name="price"
            type="number"
            min="0"
            required
            placeholder="6800"
            defaultValue={editingListing?.price ?? ""}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          <span>使用狀況</span>
          <select name="condition_score" required defaultValue={String(editingListing?.condition_score || 95)}>
            {conditionOptions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Discord ID</span>
          <input name="discord_id" placeholder="blackjerry012" defaultValue={editingListing?.discord_id || ""} />
        </label>
      </div>

      <label>
        <span>賣貨便下單連結</span>
        <input
          name="checkout_url"
          type="url"
          placeholder="https://myship.7-11.com.tw/general/detail/GM2309133835608"
          defaultValue={editingListing?.checkout_url || ""}
        />
      </label>

      <label>
        <span>照片網址</span>
        <input
          name="image_url"
          type="url"
          placeholder="可貼圖片網址，或使用下方上傳"
          defaultValue={editingListing?.image_url || ""}
        />
      </label>

      <label>
        <span>上傳照片，最多 {maxImageSizeMb}MB</span>
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
          defaultValue={editingListing?.description || ""}
        />
      </label>

      <div className="form-actions">
        <button className="submit-button" type="submit">
          {isEditing ? "儲存修改" : user ? "送出刊登" : "登入後才能刊登"}
        </button>
        {isEditing ? (
          <button className="ghost-button" type="button" onClick={onCancelEdit}>
            取消編輯
          </button>
        ) : null}
      </div>
    </form>
  );
}

function isAllowedCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "myship.7-11.com.tw";
  } catch {
    return false;
  }
}
