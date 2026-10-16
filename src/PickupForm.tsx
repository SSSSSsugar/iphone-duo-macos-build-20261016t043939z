import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { LOCAL_ID, type Account, type Action, type Data } from "./types";

const fields = [
  ["lastName", "取货人姓氏", "family-name", 20],
  ["firstName", "取货人名字", "given-name", 14],
  ["emailAddress", "取货通知邮箱", "email", 64],
  ["fullDaytimePhone", "取货人手机号", "tel-national", 12],
] as const;

export function PickupForm({
  account,
  busy,
  result,
  start,
}: {
  account: Account;
  busy: boolean;
  result?: Data;
  start: (action: Action, params?: Data) => Promise<void>;
}) {
  const [form, setForm] = useState<Data>({
    contact: { emailAddress: account.email },
    city: "",
    nationalIdLast4: "",
  });
  const [showId, setShowId] = useState(false);
  const saved = JSON.stringify(result?.config);
  useEffect(() => {
    const config = result?.config;
    if (config)
      setForm({
        contact: {
          emailAddress: account.email,
          ...(config.pickup?.contact || config.contact),
        },
        city: config.pickup?.city ?? config.delivery?.city ?? "",
        nationalIdLast4: config.pickup?.nationalIdLast4 || "",
      });
  }, [saved, account.email]);
  return (
    <section className="section" aria-label="自提配置">
      <div className="section-title">
        <h2>自提配置</h2>
        <button
          type="button"
          disabled={busy || !result?.config?.contact}
          onClick={() =>
            setForm({
              ...form,
              contact: { ...result?.config?.contact },
            })
          }
        >
          使用已保存的送货联系人
        </button>
      </div>
      <p className="muted">
        {account.id === LOCAL_ID
          ? "新账号将继承此自提配置，已有账号不会被覆盖。"
          : "保存为此账号的本地自提预设。"}
        选择门店自提后自动带入取货人信息；门店、取货日期和签到时段按官网实时可选项选择。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start("pickup_save", form);
        }}
      >
        <div className="pickup-fields">
          {fields.map(([key, label, autoComplete, maxLength]) => (
            <label key={key}>
              {label}
              <input
                required
                disabled={busy}
                value={form.contact?.[key] || ""}
                type={
                  key === "emailAddress"
                    ? "email"
                    : key === "fullDaytimePhone"
                      ? "tel"
                      : "text"
                }
                autoComplete={autoComplete}
                maxLength={maxLength}
                pattern={
                  key === "fullDaytimePhone" ? "[0-9]{11,12}" : undefined
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: { ...form.contact, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <label>
            自提城市（可选）
            <input
              disabled={busy}
              value={form.city || ""}
              placeholder="例如：重庆"
              maxLength={100}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            取货人证件号码后四位
            <div className="input-with-action">
              <input
                required
                disabled={busy}
                type={showId ? "text" : "password"}
                autoComplete="off"
                value={form.nationalIdLast4 || ""}
                maxLength={4}
                pattern="[A-Za-z0-9]{4}"
                placeholder="仅填写后四位"
                spellCheck={false}
                onChange={(e) =>
                  setForm({ ...form, nationalIdLast4: e.target.value })
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showId ? "隐藏证件后四位" : "显示证件后四位"}
                onClick={() => setShowId(!showId)}
              >
                {showId ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
        </div>
        <p className="address-guidance">
          取货人姓名及证件号码后四位须与到店出示的身份证件一致。保存后，自提页面会使用这份本地配置。
        </p>
        <button className="primary" disabled={busy} type="submit">
          保存自提配置
        </button>
      </form>
    </section>
  );
}
