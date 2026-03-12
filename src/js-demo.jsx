import { useState } from "react"

export default function JSDemo() {
  const [name, setName] = useState("")
  const [greeting, setGreeting] = useState("")
  const [score, setScore] = useState(0)
  const [grade, setGrade] = useState("")
  const [items, setItems] = useState(["🍕 Pizza", "🍜 Ramen", "🍣 Sushi"])
  const [newItem, setNewItem] = useState("")
  const [activeTab, setActiveTab] = useState("variables")

  const getGrade = (s) => {
    if (s >= 80) return "A 🌟"
    if (s >= 70) return "B 👍"
    if (s >= 60) return "C 😐"
    return "ลองใหม่นะ 💪"
  }

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem])
      setNewItem("")
    }
  }

  const tabs = [
    { id: "variables", label: "📦 Variables" },
    { id: "functions", label: "⚙️ Functions" },
    { id: "arrays", label: "📋 Arrays" },
  ]

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'Courier New', monospace",
      padding: "24px",
      color: "#e0e0ff"
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{
            fontSize: 28, fontWeight: 900, margin: 0,
            background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>JavaScript มีชีวิต!</h1>
          <p style={{ color: "#9ca3af", marginTop: 6, fontSize: 14 }}>แตะ แก้ไข เห็นผลทันที 👇</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "10px 4px", borderRadius: 10,
              border: activeTab === t.id ? "2px solid #a78bfa" : "2px solid #374151",
              background: activeTab === t.id ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
              color: activeTab === t.id ? "#a78bfa" : "#9ca3af",
              cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{
          background: "rgba(255,255,255,0.05)", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)", padding: 24
        }}>
          {activeTab === "variables" && (
            <div>
              <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 10, fontSize: 13, color: "#60a5fa" }}>
                <span style={{ color: "#f472b6" }}>const</span> name = <span style={{ color: "#34d399" }}>"{name || "???"}"</span><br/>
                <span style={{ color: "#f472b6" }}>const</span> greeting = <span style={{ color: "#34d399" }}>"{greeting || "???"}"</span>
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>👇 แก้ค่าตัวแปร <code style={{color:"#a78bfa"}}>name</code> แล้วดูผลลัพธ์:</p>
              <input
                value={name}
                onChange={e => { setName(e.target.value); setGreeting(e.target.value ? `สวัสดี ${e.target.value}! 👋` : "") }}
                placeholder="พิมพ์ชื่อของคุณ..."
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #4b5563", background: "rgba(0,0,0,0.4)",
                  color: "#e0e0ff", fontSize: 14, boxSizing: "border-box", outline: "none"
                }}
              />
              {greeting && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                  color: "#34d399", fontSize: 16, fontWeight: 700, textAlign: "center"
                }}>{greeting}</div>
              )}
            </div>
          )}

          {activeTab === "functions" && (
            <div>
              <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 10, fontSize: 12, color: "#60a5fa", lineHeight: 1.7 }}>
                <span style={{ color: "#f472b6" }}>function</span> <span style={{ color: "#fbbf24" }}>getGrade</span>(score) {"{"}<br/>
                &nbsp;&nbsp;<span style={{ color: "#f472b6" }}>if</span> (score &gt;= 80) <span style={{ color: "#f472b6" }}>return</span> <span style={{ color: "#34d399" }}>"A 🌟"</span><br/>
                &nbsp;&nbsp;<span style={{ color: "#f472b6" }}>if</span> (score &gt;= 70) <span style={{ color: "#f472b6" }}>return</span> <span style={{ color: "#34d399" }}>"B 👍"</span><br/>
                &nbsp;&nbsp;<span style={{ color: "#f472b6" }}>return</span> <span style={{ color: "#34d399" }}>"ลองใหม่ 💪"</span><br/>
                {"}"}
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>👇 เลื่อน slider เรียก function ด้วยคะแนน: <code style={{color:"#a78bfa"}}>{score}</code></p>
              <input type="range" min={0} max={100} value={score}
                onChange={e => { setScore(+e.target.value); setGrade(getGrade(+e.target.value)) }}
                style={{ width: "100%", accentColor: "#a78bfa", marginBottom: 8 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                <span>0</span><span style={{ color: "#a78bfa", fontWeight: 700 }}>คะแนน: {score}</span><span>100</span>
              </div>
              {grade && (
                <div style={{
                  padding: 14, borderRadius: 10, textAlign: "center",
                  background: score >= 80 ? "rgba(52,211,153,0.15)" : score >= 70 ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
                  border: `1px solid ${score >= 80 ? "rgba(52,211,153,0.4)" : score >= 70 ? "rgba(96,165,250,0.4)" : "rgba(251,191,36,0.4)"}`,
                  color: score >= 80 ? "#34d399" : score >= 70 ? "#60a5fa" : "#fbbf24",
                  fontSize: 20, fontWeight: 900
                }}>เกรด {grade}</div>
              )}
            </div>
          )}

          {activeTab === "arrays" && (
            <div>
              <div style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 10, fontSize: 13, color: "#60a5fa" }}>
                <span style={{ color: "#f472b6" }}>let</span> items = [<span style={{ color: "#34d399" }}>{items.map(i => `"${i}"`).join(", ")}</span>]
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>👇 เพิ่มของเข้า Array:</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newItem} onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addItem()}
                  placeholder="พิมพ์แล้วกด Add..."
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: "1px solid #4b5563", background: "rgba(0,0,0,0.4)",
                    color: "#e0e0ff", fontSize: 14, outline: "none"
                  }}
                />
                <button onClick={addItem} style={{
                  padding: "10px 16px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                  color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14
                }}>Add</button>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    padding: "8px 14px", borderRadius: 8,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14
                  }}>
                    <span><span style={{ color: "#6b7280", marginRight: 8 }}>[{i}]</span>{item}</span>
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                items.length = <span style={{ color: "#a78bfa" }}>{items.length}</span>
              </div>
            </div>
          )}
        </div>
        <p style={{ textAlign: "center", color: "#4b5563", fontSize: 12, marginTop: 20 }}>
          นี่คือ JavaScript ทำงานจริงในเบราว์เซอร์ ✨
        </p>
      </div>
    </div>
  )
}
