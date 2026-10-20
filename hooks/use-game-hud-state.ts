'use client'

import { useMemo } from 'react'
import type { ChatItem } from '@/types/app'

export interface StatusBar {
  name: string
  code: string
  value: number
  maxValue: number
  percentage: number
  color: string
}

export interface EquipmentItem {
  slot: string
  name: string
  desc?: string
}

export interface SkillTrait {
  name: string
  grade: string
  color: string
}

export interface InventoryItem {
  name: string
  count: number | string
  desc?: string
}

export interface QuestItem {
  title: string
  isMain: boolean
  progress?: string
  reward?: string
}

export interface CompanionInfo {
  name: string
  avatar: string
  affinity: number
  title?: string
  traits?: SkillTrait[]
  relation?: string
  status?: string
  classifiedIntel?: {
    trigger: string
    detail: string
  }
}

export interface ChoiceOption {
  key: string
  label: string
  actionText: string
}

export interface GameHudState {
  playerName: string
  realm: string
  rank: string
  world: string
  worldOffset: string
  currency: number
  currencyName: string
  statusBars: StatusBar[]
  equipment: EquipmentItem[]
  skills: SkillTrait[]
  inventory: InventoryItem[]
  quests: QuestItem[]
  activeCompanion: CompanionInfo | null
  latestChoices: ChoiceOption[]
}

const GRADE_COLOR_MAP: Record<string, string> = {
  '金': 'border-amber-400/50 bg-amber-500/15 text-amber-300',
  '紫': 'border-purple-400/50 bg-purple-500/15 text-purple-300',
  '蓝': 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300',
  '绿': 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
  '红': 'border-rose-400/50 bg-rose-500/15 text-rose-300',
  '白': 'border-slate-400/50 bg-slate-500/15 text-slate-300',
}

export function useGameHudState(chatList: ChatItem[], isResponding?: boolean): GameHudState {
  return useMemo(() => {
    // 默认保底状态
    let playerName = '轮回者'
    let realm = '凡人未入阶'
    let rank = 'E'
    let world = '《无限恐怖》主神空间'
    let worldOffset = '0.0%'
    let currency = 1000
    let currencyName = '因果点'
    
    let hpCurrent = 100
    let hpMax = 100
    let mpCurrent = 50
    let mpMax = 50
    let spCurrent = 100
    let spMax = 100
    let hasHp = false
    let hasMp = false
    let hasSp = false

    const equipment: EquipmentItem[] = []
    const skills: SkillTrait[] = []
    const inventory: InventoryItem[] = []
    const quests: QuestItem[] = []
    let activeCompanion: CompanionInfo | null = null
    const latestChoices: ChoiceOption[] = []

    // 1. 先检查第一条玩家开局信息，提取初始姓名、评级与锚定位面
    const firstUserMsg = chatList.find(item => !item.isAnswer && !item.isOpeningStatement)?.content
    if (firstUserMsg) {
      const worldMatch = firstUserMsg.match(/1\.\s*锚定位面：([^\n]+)/)
      if (worldMatch && worldMatch[1]) world = worldMatch[1].trim()

      const nameMatch = firstUserMsg.match(/姓名:\s*([^\s｜|]+)/)
      if (nameMatch && nameMatch[1]) playerName = nameMatch[1].trim()

      const rankMatch = firstUserMsg.match(/\[评级:\s*([A-Za-z]+)\]/)
      if (rankMatch && rankMatch[1]) rank = rankMatch[1].trim().toUpperCase()

      const xpMatch = firstUserMsg.match(/外挂金手指\/核心系统:\s*([^\n]+)/)
      if (xpMatch && xpMatch[1]) {
        skills.push({
          grade: '金',
          name: xpMatch[1].trim(),
          color: GRADE_COLOR_MAP['金'],
        })
      }
    }

    // 2. 提取最新的选项 (A/B/C/D)
    // 严格限制：必须从决策引导区域提取，先净化思考链与内部推演逻辑
    const assistantMessages = chatList.filter(item => item.isAnswer && item.content)
    const rawLatestAnswer = assistantMessages[assistantMessages.length - 1]?.content || ''

    if (rawLatestAnswer) {
      // 净化思考链与内部演算
      const latestAnswer = rawLatestAnswer
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think>[\s\S]*$/gi, '')
        .replace(/🔄\s*系统核心演算逻辑[\s\S]*?(?=📖|#|<details|$)/gi, '')

      const choiceHeadingMatch = latestAnswer.match(
        /(?:(?:[#*`\s]*)(?:(?:🎲|🎯|⚡|【)\s*)?(?:行动指令与决策引导|决策引导|行动指令|行动抉择|行动指南|可选行动|你要如何回应[？?]?|行动建议|行动选项|下一步行动|决策分支)[\s\S]*$)/i
      )
      
      const targetText = choiceHeadingMatch ? choiceHeadingMatch[0] : latestAnswer
      const lines = targetText.split('\n')
      for (const line of lines) {
        const cleanLine = line.trim()
        // 匹配各种格式的序号：1. / 1、 / [1] / (1) / A. / A、 / [A] / (A) / - 1. / * A. / 选项1:
        const m = cleanLine.match(/^[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s]\s*(.+)$/)
        if (m) {
          let label = m[1].trim()
          // 剥离多余 Markdown 加粗与序号前缀
          label = label.replace(/\*\*/g, '').trim()
          label = label.replace(/^\[?[A-Da-d1-4]\]?\s*[\.\、\:\：\-\s]*/, '').trim()
          if (label.includes('自由输入') || label.includes('✍️') || label.length < 2) continue
          if (latestChoices.length < 4) {
            latestChoices.push({
              key: String(latestChoices.length + 1),
              label,
              actionText: label,
            })
          }
        }
      }
    }

    // 从最近的消息向后提取状态信息
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const rawContent = assistantMessages[i].content || ''

      // 核心净化：彻底剔除思考链与内部推演步骤，杜绝AI的草稿/动作步骤泄露为装备或属性
      const content = rawContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think>[\s\S]*$/gi, '')
        .replace(/🔄\s*系统核心演算逻辑[\s\S]*?(?=📖|#|<details|$)/gi, '')

      // HP
      if (!hasHp) {
        const hpMatch = content.match(/(?:HP|生命值|生命|气血)[:\s]+(\d+)\s*\/\s*(\d+)/i)
        if (hpMatch) {
          hpCurrent = parseInt(hpMatch[1], 10)
          hpMax = parseInt(hpMatch[2], 10)
          hasHp = true
        }
      }

      // MP / 能量 / 精神力
      if (!hasMp) {
        const mpMatch = content.match(/(?:MP|法力|能量|精神力|内力|真气)[:\s]+(\d+)\s*\/\s*(\d+)/i)
        if (mpMatch) {
          mpCurrent = parseInt(mpMatch[1], 10)
          mpMax = parseInt(mpMatch[2], 10)
          hasMp = true
        }
      }

      // SP / 饱食度 / 体力
      if (!hasSp) {
        const spMatch = content.match(/(?:SP|饱食度|饥饿度|耐力|体力)[:\s]+(\d+)\s*\/\s*(\d+)/i)
        if (spMatch) {
          spCurrent = parseInt(spMatch[1], 10)
          spMax = parseInt(spMatch[2], 10)
          hasSp = true
        }
      }

      // 货币 / 因果点 / 奖励点
      const currMatch = content.match(/(?:因果点|奖励点|金币|通用点|贡献点)[:\s]+(\d+)/)
      if (currMatch) {
        currency = parseInt(currMatch[1], 10)
        if (content.includes('因果点')) currencyName = '因果点'
        else if (content.includes('奖励点')) currencyName = '奖励点'
        else if (content.includes('金币')) currencyName = '金币'
      }

      // 境界 / 阶位
      const realmMatch = content.match(/【基础信息】[^\n]*?(?:境界|阶位)[:\s]*([^\s|｜]+)/)
      if (realmMatch) realm = realmMatch[1].trim()

      // 评级
      const rMatch = content.match(/【基础信息】[^\n]*?(?:评级|战力)[:\s]*([A-Za-z0-9]+)/)
      if (rMatch) rank = rMatch[1].trim().toUpperCase()

      // 世界与世界偏移
      const worldOffsetMatch = content.match(/(?:世界(?:线)?偏移(?:度)?|因果偏移)[:\s]*([0-9\.]+\s*%)/)
      if (worldOffsetMatch) worldOffset = worldOffsetMatch[1].trim()

      const worldMatch = content.match(/【当前世界与偏移】\s*([^|｜\n]+)/)
      if (worldMatch) world = worldMatch[1].trim()

      // 装备列表：仅在玩家档案作用域中严格匹配，过滤提示词思考草稿
      if (equipment.length === 0) {
        const profileScopeMatch = content.match(/<details[^>]*>\s*<summary>[^<]*?(?:玩家档案|角色档案|属性面板)[^<]*<\/summary>([\s\S]*?)(?:<\/details>|$)/i)
        const scope = profileScopeMatch ? profileScopeMatch[1] : content

        const eqSection = scope.match(/【(?:装备|已装备|当前佩戴)】([\s\S]*?)(?=【|<\/details>|$)/)
        if (eqSection) {
          const validSlots = new Set(['武器', '主手', '主手武器', '副手', '副手武器', '防具', '护甲', '作战服', '外套', '饰品', '头部', '胸部', '腿部', '随身武器', '随身装备', '法宝', '特殊', '装备'])
          const invalidKeywords = ['字数', '风格', '步骤', '动作', '注意', 'draft', '考虑', '逻辑', '输出', '描写', '分析', '确认', '可能', '并未', '熟练地', '滑入', '指路']

          const lines = eqSection[1].split('\n')
          for (let l of lines) {
            l = l.trim().replace(/^[-*•\s]+/, '')
            if (!l || l.includes('</details>') || l.includes('<details>')) continue
            l = l.replace(/^\*\*(.*?)\*\*$/, '$1').trim()
            if (invalidKeywords.some(kw => l.toLowerCase().includes(kw))) continue

            if (l.includes(':') || l.includes('：')) {
              const parts = l.split(/[:：]/)
              const slot = parts[0].trim().replace(/\*/g, '')
              const name = parts.slice(1).join(':').trim().replace(/\*/g, '')
              if ((validSlots.has(slot) || slot.length <= 6) && name.length > 0 && name.length < 50) {
                equipment.push({ slot: slot || '随身武器', name })
              }
            } else if (l.length > 0 && l.length < 40) {
              equipment.push({ slot: '随身武器', name: l.replace(/\*/g, '') })
            }
          }
        }

        // 若【装备】栏未列出但【随身背包】中有明确标记的装备
        if (equipment.length === 0) {
          const invEqMatch = scope.match(/[-*•\s]*\*{0,2}(?:装备|随身武器)\*{0,2}[:：]\s*\*{0,2}([^\n*]+)/i)
          if (invEqMatch) {
            const eqName = invEqMatch[1].trim().replace(/\*/g, '')
            if (eqName.length > 0 && eqName.length < 50) {
              equipment.push({ slot: '随身武器', name: eqName })
            }
          }
        }
      }

      // 天赋词条：清洗掉 Markdown 加粗和多余中括号
      if (skills.length <= 1) {
        const traitMatches = content.matchAll(/\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([^\n<]+)/g)
        for (const tm of traitMatches) {
          const grade = tm[1]
          const rawName = tm[2].trim()
          const traitMatch = rawName.match(/^\*{0,2}\[?\s*(.*?)\s*\]?\*{0,2}(?:[:：]\s*(.*))?$/)
          let tname = rawName
          if (traitMatch && traitMatch[1]) {
            tname = traitMatch[1].replace(/\*/g, '').trim()
          } else {
            tname = tname.replace(/\*/g, '').trim()
          }
          if (tname && !skills.some(s => s.name === tname)) {
            skills.push({
              grade,
              name: tname,
              color: GRADE_COLOR_MAP[grade] || GRADE_COLOR_MAP['蓝'],
            })
          }
        }
      }

      // 背包物品：清洗掉类似 **装备**: 或 **消耗品**: 前缀与加粗符号
      if (inventory.length === 0) {
        const invSection = content.match(/【(?:随身背包|物品栏|背包|行囊)】([\s\S]*?)(?=【|<\/details>|$)/)
        if (invSection) {
          const lines = invSection[1].split('\n')
          for (let l of lines) {
            l = l.trim().replace(/^[-*•\s]+/, '')
            if (!l || l.includes('</details>') || l.includes('<details>') || l.includes('<summary>')) continue

            // 剥离类别前缀
            const catMatch = l.match(/^\*{0,2}(?:装备|消耗品|道具|杂物|材料|特殊物品|物品)\*{0,2}[:：]\s*(.+)$/)
            if (catMatch) {
              l = catMatch[1].trim()
            }
            l = l.replace(/\*\*/g, '').trim()

            const cntMatch = l.match(/^(.*?)\s*[xX*×]\s*([0-9\.]+(?:[^\s]+)?)$/)
            if (cntMatch) {
              inventory.push({ name: cntMatch[1].trim(), count: cntMatch[2].trim() })
            } else {
              inventory.push({ name: l, count: 1 })
            }
          }
        }
      }

      // 任务
      if (quests.length === 0) {
        const mainQ = content.match(/【主线任务】([^\n]+)/)
        if (mainQ) quests.push({ title: mainQ[1].trim(), isMain: true })

        const subQ = content.match(/【支线任务】([^\n]+)/)
        if (subQ) quests.push({ title: subQ[1].trim(), isMain: false })
      }

      // 随行同伴/交互对象
      if (!activeCompanion) {
        const npcMatch = content.match(/<details[^>]*>\s*<summary>[^<]*?(?:交互对象|同伴|伙伴)[^|]*\|\s*([^<]+?)<\/summary>([\s\S]*?)(?:<\/details>|$)/i)
        if (npcMatch) {
          const npcName = npcMatch[1].trim()
          const npcBody = npcMatch[2]

          let affinity = 35
          // 兼容 好感度: 77 或 【关系】玩家: **77/100**
          const affMatch = npcBody.match(/(?:好感度|好感|羁绊|关系[^\n]*?)[:\s]*\*{0,2}(\d+)(?:\s*\/\s*100)?/)
          if (affMatch) affinity = parseInt(affMatch[1], 10)

          let relation = '中立信赖'
          const relMatch = npcBody.match(/【关系】([^\n]+)/)
          if (relMatch) relation = relMatch[1].trim()

          let status = '正常'
          const statMatch = npcBody.match(/【状态】([^\n]+)/)
          if (statMatch) status = statMatch[1].trim()

          let title = '剧情随行伙伴'
          const locMatch = npcBody.match(/【定位】([^\n]+)/)
          if (locMatch) {
            title = locMatch[1].replace(/[\[\]{}*]/g, '').trim()
          }

          // 提取机密情报
          let classifiedIntel: { trigger: string; detail: string } | undefined
          const intelMatch = npcBody.match(/(?:【隐藏信息】\s*)?(?:🔍\s*)?观测判定通过[（(](?:点击查看详情)?[）)]\s*[：:]\s*([^\n<]+)/i)
          if (intelMatch) {
            classifiedIntel = {
              trigger: '🔍 观测判定通过（点击查看详情）',
              detail: intelMatch[1].trim(),
            }
          }

          activeCompanion = {
            name: npcName,
            avatar: '👥',
            affinity,
            title,
            relation,
            status,
            classifiedIntel,
          }
        }
      }
    }

    // 保底装备与背包数据 (若AI尚未输出)
    if (equipment.length === 0) {
      equipment.push({ slot: '随身武器', name: '战术折叠刀' })
      equipment.push({ slot: '防具', name: '战术作战服' })
    }
    if (inventory.length === 0) {
      inventory.push({ name: '止血急救绷带', count: 2 })
      inventory.push({ name: '高能营养压缩口粮', count: 3 })
      inventory.push({ name: '微型战术手电', count: 1 })
    }
    if (skills.length === 0) {
      skills.push({ grade: '金', name: '超低消耗无限重生系统', color: GRADE_COLOR_MAP['金'] })
      skills.push({ grade: '蓝', name: '敏锐直觉感知', color: GRADE_COLOR_MAP['蓝'] })
    }
    if (quests.length === 0) {
      quests.push({ title: '在当前轮回恐怖片世界线存活至任务倒计时结束', isMain: true })
    }

    // 构造状态条列表
    const statusBars: StatusBar[] = [
      {
        name: '生命体征 (HP)',
        code: 'HP',
        value: hpCurrent,
        maxValue: hpMax,
        percentage: Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100)),
        color: hpCurrent / hpMax <= 0.25 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500',
      },
      {
        name: '能量储备 (MP)',
        code: 'MP',
        value: mpCurrent,
        maxValue: mpMax,
        percentage: Math.min(100, Math.max(0, (mpCurrent / mpMax) * 100)),
        color: 'bg-cyan-500',
      },
      {
        name: '生理饱食 (SP)',
        code: 'SP',
        value: spCurrent,
        maxValue: spMax,
        percentage: Math.min(100, Math.max(0, (spCurrent / spMax) * 100)),
        color: 'bg-amber-500',
      },
    ]

    return {
      playerName,
      realm,
      rank,
      world,
      worldOffset,
      currency,
      currencyName,
      statusBars,
      equipment,
      skills,
      inventory,
      quests,
      activeCompanion,
      latestChoices,
    }
  }, [chatList, isResponding])
}
