"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthPanel } from "@/components/auth-panel";
import { ListingForm } from "@/components/listing-form";
import { categories, categoryLabels, type ListingCategory } from "@/lib/categories";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const listingDurationDays = 60;

type Filter = "all" | ListingCategory;
type SortMode = "newest" | "priceLow" | "priceHigh" | "condition";

export function MarketplaceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      checkAdminStatus(data.user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadListings();
  }, [isAdmin]);

  async function loadListings() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      setNotice(error.message);
    } else {
      setListings((data || []) as Listing[]);
    }

    setLoading(false);
  }

  async function checkAdminStatus(currentUser: User | null) {
    if (!supabase || !currentUser?.email) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from("admins")
      .select("email")
      .eq("email", currentUser.email.toLowerCase())
      .maybeSingle();

    setIsAdmin(Boolean(data && !error));
  }

  async function deleteListing(listing: Listing) {
    if (!supabase || !user || (listing.user_id !== user.id && !isAdmin)) return;
    const confirmed = window.confirm(`確定要刪除「${listing.title}」嗎？`);
    if (!confirmed) return;

    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) {
      setNotice(error.message);
      return;
    }

    setSelectedListing(null);
    await loadListings();
  }

  async function updateListingStatus(listing: Listing, status: "active" | "sold" | "hidden" | "expired") {
    if (!supabase || !user) return;

    const canMarkSold = listing.user_id === user.id || isAdmin;
    const canHide = isAdmin;
    const canRestore = isAdmin;
    if (
      (status === "sold" && !canMarkSold) ||
      (status === "hidden" && !canHide) ||
      (status === "active" && !canRestore)
    ) {
      return;
    }

    const actionText =
      status === "sold" ? "標記為已售出" : status === "hidden" ? "管理員隱藏" : "重新上架";
    const confirmed = window.confirm(`確定要將「${listing.title}」${actionText}嗎？`);
    if (!confirmed) return;

    const patch =
      status === "active"
        ? {
            status,
            expires_at: new Date(Date.now() + listingDurationDays * 24 * 60 * 60 * 1000).toISOString()
          }
        : { status };

    const { error } = await supabase.from("listings").update(patch).eq("id", listing.id);
    if (error) {
      setNotice(error.message);
      return;
    }

    setSelectedListing(null);
    await loadListings();
  }

  function openExternalLink(url: string) {
    const confirmed = window.confirm(
      "即將前往外部網站，請確認網址與交易安全。JH Marketplace 不會代收款，也不保證外部交易內容。"
    );

    if (confirmed) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  const visibleListings = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = listings.filter((listing) => {
      const matchesCategory = filter === "all" || listing.category === filter;
      const haystack = `${listing.title} ${listing.description} ${listing.discord_id || ""}`.toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });

    if (sortMode === "priceLow") filtered.sort((a, b) => a.price - b.price);
    if (sortMode === "priceHigh") filtered.sort((a, b) => b.price - a.price);
    if (sortMode === "condition") {
      filtered.sort((a, b) => b.condition_score - a.condition_score);
    }
    if (sortMode === "newest") {
      filtered.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    }

    return filtered;
  }, [filter, listings, query, sortMode]);

  return (
    <div className="site-shell">
      <div className="top-strip">KEYBOARDS / KEYCAPS / STABILIZERS / PARTS / USED MARKET</div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="JH Marketplace home">
          <span className="brand-mark">JH</span>
          <span>
            <strong>JH MARKETPLACE</strong>
            <small>鍵盤人的二手交換刊登板</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a href="#market">MARKET</a>
          <a href="#sell">SELL</a>
          <a href="#guide">GUIDE</a>
        </nav>

        <div className="header-actions">
          <a className="post-button" href="#sell">
            我要刊登
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">USED KEYBOARD MARKET</p>
            <h1>JH MARKETPLACE</h1>
            <p>
              給 Discord 社群朋友上架二手鍵盤、鍵帽、衛星軸與其他周邊。留下商品狀況、
              詳細照片、DC ID 或賣貨便連結，買賣雙方自己聯絡。
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#market">
                逛二手商品
              </a>
              <a className="secondary-link" href="#sell">
                刊登你的商品
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="keyboard-board">
              {Array.from({ length: 30 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <div className="hero-card">
              <strong>{listings.length}</strong>
              <span>active listings from the community</span>
            </div>
          </div>
        </section>

        {!isSupabaseConfigured ? (
          <section className="setup-warning">
            <strong>尚未設定 Supabase</strong>
            <span>
              請先新增 `.env.local`，填入 `NEXT_PUBLIC_SUPABASE_URL` 和
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，再執行 `supabase/schema.sql`。
            </span>
          </section>
        ) : null}

        {notice ? (
          <section className="setup-warning">
            <strong>系統訊息</strong>
            <span>{notice}</span>
          </section>
        ) : null}

        <section className="category-band" aria-label="商品分類">
          <button
            className={`category-pill ${filter === "all" ? "is-active" : ""}`}
            type="button"
            onClick={() => setFilter("all")}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              className={`category-pill ${filter === category.value ? "is-active" : ""}`}
              key={category.value}
              type="button"
              onClick={() => setFilter(category.value)}
            >
              {category.label}
            </button>
          ))}
        </section>

        <section className="collection-toolbar" id="market">
          <div>
            <p className="eyebrow">MARKET BOARD</p>
            <h2>社群二手刊登</h2>
          </div>
          <div className="toolbar-controls">
            <label>
              <span>搜尋</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="搜尋小鱷魚、PBT、TUX80..."
              />
            </label>
            <label>
              <span>排序</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                <option value="newest">最新上架</option>
                <option value="priceLow">價格低到高</option>
                <option value="priceHigh">價格高到低</option>
                <option value="condition">狀況最佳</option>
              </select>
            </label>
          </div>
        </section>

        <section className="product-grid" aria-live="polite">
          {visibleListings.map((listing) => (
            <article className="product-card" data-kind={listing.category} key={listing.id}>
              <div className="product-media">
                {listing.image_url ? (
                  <img className="listing-photo" src={listing.image_url} alt={listing.title} />
                ) : (
                  <div className="product-illustration" />
                )}
                <span className="product-badge">{categoryLabels[listing.category]}</span>
                <span className="condition-badge">{listing.condition_label}</span>
                {isAdmin && effectiveStatus(listing) !== "active" ? (
                  <span className={`status-badge status-${effectiveStatus(listing)}`}>
                    {statusLabel(effectiveStatus(listing))}
                  </span>
                ) : null}
              </div>
              <div className="product-info">
                <span className="product-meta">
                  {categoryLabels[listing.category]} / {formatDate(listing.created_at)}
                </span>
                <h3 className="product-title">{listing.title}</h3>
                <p className="product-desc">{listing.description}</p>
                <div className="seller-row">DC: {listing.discord_id || "未填"}</div>
                <div className="product-foot">
                  <span className="price">{currency.format(listing.price)}</span>
                  <button className="quick-add" type="button" onClick={() => setSelectedListing(listing)}>
                    查看詳情
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {!loading && visibleListings.length === 0 ? (
          <div className="empty-state">
            <strong>目前沒有符合條件的商品</strong>
            <span>{isSupabaseConfigured ? "換個分類或關鍵字試試看。" : "設定 Supabase 後就會讀取資料。"}</span>
          </div>
        ) : null}

        <section className="sell-section" id="sell">
          <div className="sell-copy">
            <p className="eyebrow">POST A LISTING</p>
            <h2>刊登你的鍵盤周邊</h2>
            <p>
              登入只用來確認刊登者身分，不會取得你的 Email 密碼。系統使用 Supabase
              magic link 寄送一次性登入連結，商品資料會寫進資料庫，圖片會上傳到公開商品圖庫。
              你可以刪除或標記自己的刊登，管理員會協助隱藏不適合的內容。
            </p>
            <p className="trust-note">
              安全提醒：請不要在商品簡介留下密碼、住址、電話或私密資料；交易請透過 Discord
              或賣貨便自行確認。
            </p>
            <AuthPanel user={user} onAuthChange={loadListings} />
          </div>

          <ListingForm user={user} onCreated={loadListings} />
        </section>

        <section className="guide-section" id="guide">
          <div>
            <p className="eyebrow">HOW TO USE</p>
            <h2>網站使用方式</h2>
          </div>
          <div className="guide-grid">
            <article>
              <strong>1. 逛二手商品</strong>
              <p>可以用分類、搜尋和排序找到鍵盤、鍵帽、衛星軸或其他周邊，點「查看詳情」看完整狀況。</p>
            </article>
            <article>
              <strong>2. 登入後刊登</strong>
              <p>輸入 Email 收登入連結，再填商品照片、價格、使用狀況、DC ID、賣貨便連結和刊登邀請碼。</p>
            </article>
            <article>
              <strong>3. 自行聯絡交易</strong>
              <p>這裡只提供刊登與展示，買賣雙方請透過 Discord 或賣貨便自行確認商品細節與付款方式。</p>
            </article>
          </div>
        </section>
      </main>

      {selectedListing ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedListing(null)}>
          <section className="listing-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button close-dialog" type="button" onClick={() => setSelectedListing(null)}>
              ×
            </button>
            <div className="dialog-media">
              {selectedListing.image_url ? (
                <img className="listing-photo" src={selectedListing.image_url} alt={selectedListing.title} />
              ) : (
                <div className="product-illustration" />
              )}
            </div>
            <div className="dialog-body">
              <p className="eyebrow">
                {categoryLabels[selectedListing.category]} / {selectedListing.condition_label}
              </p>
              <h2>{selectedListing.title}</h2>
              <strong className="dialog-price">{currency.format(selectedListing.price)}</strong>
              <p>{selectedListing.description}</p>
              <dl className="listing-specs">
                <div>
                  <dt>上架時間</dt>
                  <dd>{formatDate(selectedListing.created_at)}</dd>
                </div>
                <div>
                  <dt>刊登期限</dt>
                  <dd>{formatDate(selectedListing.expires_at)}，共 {listingDurationDays} 天</dd>
                </div>
                <div>
                  <dt>使用狀況</dt>
                  <dd>{selectedListing.condition_label}</dd>
                </div>
                {isAdmin ? (
                  <div>
                    <dt>刊登狀態</dt>
                    <dd>{statusLabel(effectiveStatus(selectedListing))}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Discord</dt>
                  <dd>{selectedListing.discord_id || "未提供"}</dd>
                </div>
              </dl>
              <div className="dialog-actions">
                {selectedListing.checkout_url ? (
                  <button className="primary-link" type="button" onClick={() => openExternalLink(selectedListing.checkout_url!)}>
                    前往賣貨便
                  </button>
                ) : null}
                {user?.id === selectedListing.user_id || isAdmin ? (
                  <button className="secondary-link" type="button" onClick={() => updateListingStatus(selectedListing, "sold")}>
                    標記已售出
                  </button>
                ) : null}
                {isAdmin ? (
                  <button className="secondary-link" type="button" onClick={() => updateListingStatus(selectedListing, "hidden")}>
                    管理員隱藏
                  </button>
                ) : null}
                {isAdmin && effectiveStatus(selectedListing) !== "active" ? (
                  <button className="secondary-link" type="button" onClick={() => updateListingStatus(selectedListing, "active")}>
                    重新上架
                  </button>
                ) : null}
                {user?.id === selectedListing.user_id || isAdmin ? (
                  <button className="danger-button" type="button" onClick={() => deleteListing(selectedListing)}>
                    {user?.id === selectedListing.user_id ? "刪除我的刊登" : "管理員刪除"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status: Listing["status"]) {
  return {
    active: "刊登中",
    sold: "已售出",
    hidden: "已隱藏",
    expired: "已過期"
  }[status];
}

function effectiveStatus(listing: Listing): Listing["status"] {
  if (listing.status === "active" && Date.parse(listing.expires_at) <= Date.now()) {
    return "expired";
  }

  return listing.status;
}
