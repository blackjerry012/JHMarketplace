"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthPanelProps = {
  user: User | null;
  onAuthChange: () => void;
};

export function AuthPanel({ user, onAuthChange }: AuthPanelProps) {
  async function signIn(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    if (!email || !supabase) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      window.alert(error.message);
      return;
    }

    window.alert("登入信已寄出，請到信箱點 magic link。");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    onAuthChange();
  }

  if (user) {
    return (
      <div className="auth-card">
        <span>已登入</span>
        <strong>{user.email}</strong>
        <button className="ghost-button" type="button" onClick={signOut}>
          登出
        </button>
      </div>
    );
  }

  return (
    <form className="auth-card" action={signIn}>
      <span>登入後即可上架與管理自己的商品</span>
      <label>
        <span>Email</span>
        <input name="email" type="email" required placeholder="you@example.com" />
      </label>
      <button className="post-button" type="submit">
        寄登入連結
      </button>
    </form>
  );
}
