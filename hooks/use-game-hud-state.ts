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
  companions: CompanionInfo[]
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
  '灰': 'border-slate-500/50 bg-slate-600/15 text-slate-400',
  '灰纹': 'border-slate-500/50 bg-slate-600/15 text-slate-400',
}

// 智能根据物品名称识别装备槽位（武器、防具、饰品），杜绝将迷彩作战服误标为随身武器
function inferEquipmentSlot(itemName: string): string {
  const name = itemName.trim()
  if (/(?:服|甲|战服|作战服|风衣|战甲|护甲|防弹衣|外骨骼|外套|背心|长袍|战袍|靴|手套|斗篷|防化服)/i.test(name)) {
    return '防具'
  }
  if (/(?:戒|链|表|手环|徽章|玉佩|护符|项链|戒指|指环|吊坠|勋章|配饰|挂饰)/i.test(name)) {
    return '饰品'
  }
  if (/(?:刀|枪|剑|匕首|冲锋枪|突击步枪|手枪|步枪|狙击枪|炮|弓|箭|弩|杖|棍|棒|斧|矛|戟|刃|鞭|折叠刀)/i.test(name)) {
    return '随身武器'
  }
  return '随身装备'
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
    const latestChoices: ChoiceOption[] = []

    // 1. 先检查第一条玩家开局信息，提取初始姓名、评级、锚定位面、初始天赋与初始物资
    const firstUserMsg = chatList.find(item => !item.isAnswer && !item.isOpeningStatement)?.content
    if (firstUserMsg) {
      const worldMatch = firstUserMsg.match(/1\.\s*锚定位面：([^\n]+)/)
      if (worldMatch && worldMatch[1]) world = worldMatch[1].trim()

      const nameMatch = firstUserMsg.match(/姓名:\s*([^\s｜|]+)/)
      if (nameMatch && nameMatch[1]) playerName = nameMatch[1].trim()

      const rankMatch = firstUserMsg.match(/\[评级:\s*([A-Za-z0-9]+)\]/)
      if (rankMatch && rankMatch[1]) rank = rankMatch[1].trim().toUpperCase()

      // 提取宿主特权系统 / 金手指专属天赋
      const xpMatch = firstUserMsg.match(/(?:宿主特权系统|外挂金手指\/核心系统)[:\s]*([^\s|｜\n]+)/)
      if (xpMatch && xpMatch[1]) {
        const xpName = xpMatch[1].trim()
        if (!skills.some(s => s.name === xpName)) {
          skills.push({
            grade: '金',
            name: xpName,
            color: GRADE_COLOR_MAP['金'],
          })
        }
      }

      // 提取 4. 激活本源专属天赋 与 5. 激活异界与通用天赋
      const talentMatches = firstUserMsg.matchAll(/-\s*\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([^:\n]+)/g)
      for (const tm of talentMatches) {
        const grade = tm[1]
        const tname = tm[2].trim()
        if (tname && !skills.some(s => s.name === tname)) {
          skills.push({
            grade,
            name: tname,
            color: GRADE_COLOR_MAP[grade] || GRADE_COLOR_MAP['蓝'],
          })
        }
      }

      // 提取初始随身物资（解析初始武器、防具与背包消耗品）
      const itemsMatch = firstUserMsg.match(/初始随身物资[:：]\s*([^\n]+)/)
      if (itemsMatch && itemsMatch[1]) {
        const itemParts = itemsMatch[1].split(/[,，、]/)
        for (const part of itemParts) {
          const itemStr = part.trim()
          if (!itemStr || itemStr.includes('无')) continue
          const m = itemStr.match(/^(.+?)(?:\s*[xX*×]\s*(\d+))?$/)
          const itemName = m ? m[1].trim() : itemStr
          const count = m && m[2] ? m[2].trim() : '1'

          // 智能分配装备（武器、防具、饰品）与随身背包
          const slot = inferEquipmentSlot(itemName)
          if (/(?:刀|枪|剑|匕首|冲锋枪|步枪|炮|斧|服|甲|战服|作战服|风衣|战甲|护甲|手环|表|防弹)/i.test(itemName)) {
            if (!equipment.some(e => e.name === itemName)) {
              equipment.push({ slot, name: itemName })
            }
          } else {
            if (!inventory.some(i => i.name === itemName)) {
              inventory.push({ name: itemName, count })
            }
          }
        }
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
        const m = cleanLine.match(/^[-*•✦\s]*(?:\[?[A-Da-d1-4]\]?|\([A-Da-d1-4]\)|选项\s*[A-Da-d1-4])\s*[\.\、\:\：\-\s]\s*(.+)$/)
        if (m) {
          let label = m[1].trim()
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

    // 3. 多NPC全局扫描与提取（按时间顺序更新好感与状态，保证在场所有NPC全部保留）
    const companionMap = new Map<string, CompanionInfo>()

    for (let msgIdx = 0; msgIdx < assistantMessages.length; msgIdx++) {
      const msgContent = assistantMessages[msgIdx].content || ''
      const detailsRegex = /<details(?:\s+[^>]*)?>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)(?:<\/details>|$)/gi
      let match: RegExpExecArray | null

      while ((match = detailsRegex.exec(msgContent)) !== null) {
        const summary = match[1].trim()
        const body = match[2].trim()

        // 过滤玩家档案或系统面板
        if (/(?:玩家档案|角色档案|属性面板|系统面板|数据看板|多维系统状态栏)/.test(summary)) {
          continue
        }

        // 识别是否为人物 / NPC / 同伴 / 交互对象
        const isNpcBody = /(?:【基础】|【外貌】|【能力】|【定位】|【关系】|【状态】)/.test(body)
        const isNpcSummary = /(?:交互|NPC|同伴|伙伴|对象|人物|角色|随行|变异体|辅助者|引导者|队长|队员)/i.test(summary) || summary.includes('|') || summary.includes('｜')

        if (!isNpcBody && !isNpcSummary) continue

        // 提取纯净姓名与身份
        let cleanSummary = summary.replace(/^[▶▼#\s]+/, '').trim()
        let npcName = ''
        let rawTitle = ''

        if (cleanSummary.includes('|') || cleanSummary.includes('｜')) {
          const parts = cleanSummary.split(/[|｜]/).map(p => p.trim())
          if (/(?:交互对象|同伴|伙伴|NPC|重点角色)\s*\d*/i.test(parts[0])) {
            npcName = parts[1]
          } else {
            npcName = parts[0]
            rawTitle = parts[1]
          }
        } else {
          npcName = cleanSummary.replace(/(?:交互对象|同伴|伙伴|NPC)\s*\d*[:：\s]*/i, '').trim()
        }

        // 深度清洗 npcName，剥离多余括号、符号与描述
        npcName = npcName.replace(/^[\[【(（](.*?)[\]】)）]$/, '$1').trim()
        const bracketMatch = npcName.match(/^([^\(（\[【]+)[\(（\[【](.*)[\)）\]】]$/)
        if (bracketMatch) {
          npcName = bracketMatch[1].trim()
          if (!rawTitle) rawTitle = bracketMatch[2].trim()
        }
        npcName = npcName.replace(/[*#]/g, '').trim()
        if (!npcName || npcName.length > 15 || npcName.length < 2) continue

        // 过滤非人物环境
        if (/(?:设施环境|潜藏威胁|环境|物品|背包|系统|面板|档案)/.test(npcName)) continue

        // 好感度
        let affinity = 20
        const affMatch = body.match(/(?:好感度|好感|羁绊|关系[^\n]*?)[:\s]*\*{0,2}(\d+)(?:\s*\/\s*100)?/)
        if (affMatch) affinity = Math.min(100, Math.max(0, parseInt(affMatch[1], 10)))

        // 关系描述
        let relation = '中立信赖'
        const relMatch = body.match(/【关系】([^\n]+)/)
        if (relMatch) relation = relMatch[1].replace(/[*\[\]]/g, '').trim()

        // 状态描述
        let status = '警戒正常'
        const statMatch = body.match(/【状态】([^\n]+)/)
        if (statMatch) status = statMatch[1].replace(/[*\[\]]/g, '').trim()

        // 称号 / 团队定位 (精炼提取核心身份，控制在8字以内，避免挤压UI)
        let title = rawTitle
        const locMatch = body.match(/【定位】([^\n]+)/)
        if (locMatch) {
          const locText = locMatch[1].replace(/[\[\]{}*()（）]/g, '').trim()
          const commaIdx = locText.search(/[,，;；|｜\/]/)
          title = (commaIdx !== -1 ? locText.slice(0, commaIdx) : locText).trim()
        }
        if (!title || title.length > 10) {
          title = title ? title.slice(0, 8) : '同行同伴'
        }

        // 专属词条
        const npcTraits: SkillTrait[] = []
        const traitSection = body.match(/【词条】([\s\S]*?)(?=【|$)/)
        if (traitSection) {
          const tMatches = traitSection[1].matchAll(/\[\s*([蓝金紫绿红白橙灰黑]|灰纹)\s*\]\s*\[?([^:\n\]]+)\]?/g)
          for (const tm of tMatches) {
            const grade = tm[1]
            npcTraits.push({
              grade,
              name: tm[2].replace(/[*\[\]]/g, '').trim(),
              color: GRADE_COLOR_MAP[grade] || GRADE_COLOR_MAP['蓝'],
            })
          }
        }

        // 观测机密情报
        let classifiedIntel: { trigger: string; detail: string } | undefined
        const intelMatch = body.match(/(?:【隐藏信息】\s*)?(?:🔍\s*)?观测判定通过[（(](?:点击查看详情)?[）)]\s*[：:]\s*([^\n<]+)/i)
        if (intelMatch) {
          classifiedIntel = {
            trigger: '🔍 观测判定通过（点击查看详情）',
            detail: intelMatch[1].trim(),
          }
        }

        // 个性化角色头像
        let avatar = '👥'
        if (/(?:女|少女|医|萝莉|姐|詹岚)/.test(body + npcName)) avatar = '👩'
        else if (/(?:杀手|队长|引导者|霸气|佣兵|张杰|马修)/.test(body + npcName)) avatar = '🧔'
        else if (/(?:白领|青年|郑吒)/.test(body + npcName)) avatar = '👨'

        companionMap.set(npcName, {
          name: npcName,
          avatar,
          affinity,
          title,
          relation,
          status,
          classifiedIntel,
          traits: npcTraits,
        })
      }
    }

    const companions: CompanionInfo[] = Array.from(companionMap.values())
    let activeCompanion: CompanionInfo | null = companions.length > 0 ? companions[0] : null

    // 4. 从最近的消息向后提取玩家核心数值（HP/MP/SP/货币等）
    // 关键隔离：先过滤掉NPC卡片，杜绝NPC数值或回复文字泄露为玩家状态
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const rawContent = assistantMessages[i].content || ''

      // 核心净化：剔除思考链、系统推演与NPC卡片
      const content = rawContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think>[\s\S]*$/gi, '')
        .replace(/🔄\s*系统核心演算逻辑[\s\S]*?(?=📖|#|<details|$)/gi, '')
        .replace(/<details(?:\s+[^>]*)?>\s*<summary>(?:(?!玩家档案|角色档案|属性面板)[\s\S])*?<\/details>/gi, '')

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

      // 装备与背包：严格限定在玩家专属档案作用域（绝不跨作用域扫描NPC或正文）
      const profileScopeMatch = rawContent.match(/<details[^>]*>\s*<summary>[^<]*?(?:玩家档案|角色档案|属性面板)[^<]*<\/summary>([\s\S]*?)(?:<\/details>|$)/i)
      if (profileScopeMatch) {
        const scope = profileScopeMatch[1]

        // 提取装备
        const eqSection = scope.match(/【(?:装备|已装备|当前佩戴)】([\s\S]*?)(?=【|<\/details>|$)/)
        if (eqSection && equipment.length <= 2) {
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
              const rawSlot = parts[0].trim().replace(/\*/g, '')
              const name = parts.slice(1).join(':').trim().replace(/\*/g, '')
              const slot = (validSlots.has(rawSlot) ? rawSlot : inferEquipmentSlot(name))
              if (name.length > 0 && name.length < 50 && !equipment.some(e => e.name === name)) {
                equipment.push({ slot, name })
              }
            } else if (l.length > 0 && l.length < 40 && !equipment.some(e => e.name === l)) {
              equipment.push({ slot: inferEquipmentSlot(l), name: l.replace(/\*/g, '') })
            }
          }
        }

        // 提取玩家新觉醒的天赋词条（仅限玩家档案内部）
        const traitMatches = scope.matchAll(/\[\s*([蓝金紫绿红白橙灰黑])\s*\]\s*([^\n<]+)/g)
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

        // 提取背包
        const invSection = scope.match(/【(?:随身背包|物品栏|背包|行囊)】([\s\S]*?)(?=【|<\/details>|$)/)
        if (invSection && inventory.length <= 3) {
          const lines = invSection[1].split('\n')
          for (let l of lines) {
            l = l.trim().replace(/^[-*•\s]+/, '')
            if (!l || l.includes('</details>') || l.includes('<details>') || l.includes('<summary>')) continue

            const catMatch = l.match(/^\*{0,2}(?:装备|消耗品|道具|杂物|材料|特殊物品|物品)\*{0,2}[:：]\s*(.+)$/)
            if (catMatch) l = catMatch[1].trim()
            l = l.replace(/\*\*/g, '').trim()

            const cntMatch = l.match(/^(.*?)\s*[xX*×]\s*([0-9\.]+(?:[^\s]+)?)$/)
            if (cntMatch) {
              if (!inventory.some(i => i.name === cntMatch[1].trim())) {
                inventory.push({ name: cntMatch[1].trim(), count: cntMatch[2].trim() })
              }
            } else if (!inventory.some(i => i.name === l)) {
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
    }

    // 保底装备与背包数据 (若玩家开局未产生)
    if (equipment.length === 0) {
      equipment.push({ slot: '随身武器', name: '军用匕首' })
      equipment.push({ slot: '防具', name: '迷彩作战服' })
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
      companions,
      activeCompanion,
      latestChoices,
    }
  }, [chatList, isResponding])
}
