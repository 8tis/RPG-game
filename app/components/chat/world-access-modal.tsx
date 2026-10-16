'use client'
import React, { useState, useMemo } from 'react'
import cn from 'classnames'

export interface WorldConfig {
  id: string
  name: string
  desc: string
  sRanks: string
  identities: { title: string; rank: string; items: string }[]
  originTalents: { name: string; rank: 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'UR'; desc: string }[]
}

export interface Talent {
  id?: string
  name: string
  rank: 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'UR'
  desc: string
  isOrigin?: boolean
}

// 预设诸天世界库
export const PRESET_WORLDS: WorldConfig[] = [
  {
    id: '215',
    name: '变形金刚',
    desc: '塞伯坦星球的内战蔓延到了地球。汽车人与霸天虎为了火种源展开激战。这里有巨大的机械生命体、变形技术和能量块。',
    sRanks: '威震天，堕落金刚，宇宙大帝，昆塔莎',
    identities: [
      { title: '芝加哥废墟中的幸存者', rank: 'E', items: '半瓶水，一块混凝土碎块' },
      { title: '第七区机密外勤特工', rank: 'C', items: '军用电击枪，绝密外星档案微缩胶卷' },
      { title: '巢穴部队技术准尉', rank: 'D', items: '战术平板，EMP电磁手雷 x 2' },
      { title: '威震天狂热崇拜者', rank: 'D', items: '赛伯坦金属碎刃，狂派通讯发信机' },
    ],
    originTalents: [
      { name: '火种源能量共鸣', rank: 'SS', desc: '可徒手为机械注灵，将其转化为忠诚的微型硅基变形体' },
      { name: '赛伯坦古语直觉', rank: 'S', desc: '无需翻译矩阵即可破译远古塞伯坦符文与领导模块协议' },
      { name: '能量块提纯精通', rank: 'S', desc: '可从高压电网或核电站中纯化高能能量块' },
      { name: '机械重组直感', rank: 'A', desc: '濒死时可将周围机械残骸吸附为外骨骼护甲' },
      { name: '磁暴脉冲抗性', rank: 'A', desc: '身体对电磁干扰与EMP脉冲完全免疫' },
      { name: '载具扫描复制', rank: 'B', desc: '目击现代载具时，可在5秒内解析其全部结构图纸' },
    ],
  },
  {
    id: '344',
    name: '无限恐怖 (生化危机一·激光通道)',
    desc: '蜂巢地下实验所已彻底沦陷，红后智能主脑锁死基地，复仇邪神与爬行者潜伏在黑暗通风管。中洲队轮回者降临激光通道前夕。',
    sRanks: '复仇邪神暴君体，激光防御矩阵主脑，威斯克，主神监视光球',
    identities: [
      { title: '安布雷拉初级实习研究员', rank: 'E', items: '门禁B级磁卡，止痛药水 x 1' },
      { title: '保护伞U.B.C.S佣兵斥候', rank: 'C', items: 'MP5战术冲锋枪，防毒面具' },
      { title: '中洲队初次降临新人', rank: 'E', items: '一包香烟，便携式打火机' },
      { title: '激光通道逃难生还者', rank: 'D', items: '备用主板钥匙，肾上腺素针剂' },
    ],
    originTalents: [
      { name: 'T病毒完美融合体', rank: 'SS', desc: '身体拥有无限变异自愈潜能，绝不丧尸化' },
      { name: '激光通道规避预知', rank: 'S', desc: '对高能激光网切片的运动轨迹拥有提前0.5秒直觉预知' },
      { name: '红后主脑逻辑后门', rank: 'S', desc: '掌握蜂巢主控系统初级管理员覆写指令' },
      { name: '丧尸生化毒素免疫', rank: 'A', desc: '免受任何感染与生化病毒神经侵蚀' },
      { name: '暴君压迫感耐受', rank: 'A', desc: '面临巨型生化Boss时精神绝不崩溃' },
      { name: '战术换弹本能', rank: 'B', desc: '换弹速度提升200%，射击后坐力降低50%' },
    ],
  },
  {
    id: '316',
    name: '宿命之环 (诡秘之主二部·特里尔)',
    desc: '蒸汽与神秘交织的地下之都。旧日支配者与外神凝视凡尘，魔药狂乱与呓语在深夜回荡，深渊与非凡聚会在阴影中滋长。',
    sRanks: '愚者克莱恩，宿命之环外神化身，特里尔地下邪神眷者',
    identities: [
      { title: '蒙苏里街的贫民流浪汉', rank: 'E', items: '发霉黑麦面包，半张占卜塔罗牌' },
      { title: '机械之心外围线人', rank: 'D', items: '蒸汽发条怀表，圣水小瓶' },
      { title: '地下黑帮小头目', rank: 'C', items: '附魔转轮手枪，劣质非凡护身符' },
    ],
    originTalents: [
      { name: '宿命契约扭转', rank: 'SS', desc: '可以将一次必死的致命因果转嫁给周围任意敌对目标' },
      { name: '窥秘人灵视天眼', rank: 'S', desc: '洞察现实灵界帷幕与非凡生物真实位格' },
      { name: '呓语绝对屏障', rank: 'S', desc: '对神明呓语和不可名状精神污染拥有天然屏蔽层' },
      { name: '魔药消化极速', rank: 'A', desc: '服用非凡魔药扮演时消化速度提升500%' },
      { name: '灵界跳跃直觉', rank: 'A', desc: '在特里尔地下迷宫中永不迷路' },
      { name: '塔罗占卜精准', rank: 'B', desc: '每日可进行一次高精度占卜预知危险' },
    ],
  },
  {
    id: '2077',
    name: '赛博朋克 (夜之城·荒坂塔)',
    desc: '霓虹闪烁的资本炼狱。义体改造、赛博精神病与超梦泛滥，企业巨头掌控一切，佣兵在来生酒吧为传奇干杯。',
    sRanks: '亚当·重锤，荒坂三郎神舆意识体，流窜AI奥特·坎宁安',
    identities: [
      { title: '圣多明戈贫民窟街头小子', rank: 'E', items: '碎屏战斗目镜，一罐廉价合成啤酒' },
      { title: '荒坂反情报部流放特工', rank: 'C', items: '军用级网络接入仓，静音消音手枪' },
      { title: '来生酒吧边缘黑客', rank: 'D', items: '破片手雷，恶魔协议破解芯片' },
    ],
    originTalents: [
      { name: '赛博精神病绝对免疫', rank: 'UR', desc: '义体承载量无上限，神经永不崩溃暴走' },
      { name: '军用斯安威斯坦时停', rank: 'SS', desc: '神经超频加速，感知时间流速变慢90%' },
      { name: '快速黑入自传病毒', rank: 'S', desc: '凝视机械敌人可在2秒内引爆其义体过热' },
      { name: '智能武器弹道自寻', rank: 'A', desc: '射击子弹拥有自动拐弯追踪能力' },
      { name: '皮下装甲硬化', rank: 'A', desc: '肉身皮肤自带防弹纤维抗性' },
      { name: '街头声望倍增', rank: 'B', desc: '夜之城所有帮派初始信任度提升' },
    ],
  },
  {
    id: '437',
    name: '梦幻西游 (人仙魔三界乱世)',
    desc: '蚩尤封印松动，天命之人再聚长安。大雁塔妖气冲天，龙宫翻江倒海，地府百鬼夜行，神魔大战一触即发。',
    sRanks: '齐天大圣孙悟空，菩提祖师，蚩尤残魂，东海龙王',
    identities: [
      { title: '建邺城打铁学徒', rank: 'E', items: '一柄青铜短剑，三个包子' },
      { title: '大唐官府外门弟子', rank: 'D', items: '官府通缉令，金疮药 x 2' },
      { title: '方寸山游方道童', rank: 'C', items: '飞行符 x 5，定魂珠' },
    ],
    originTalents: [
      { name: '横扫千军破防', rank: 'SS', desc: '物理连续三次强力斩击，无视敌方护甲' },
      { name: '九转还魂灵光', rank: 'S', desc: '濒死时自动触发保命神光重塑肉身' },
      { name: '五行灵气天成', rank: 'S', desc: '施展仙魔道法灵力消耗降低70%' },
      { name: '捉鬼符印通幽', rank: 'A', desc: '对阴魂鬼物拥有天然压制与封印权' },
      { name: '召唤兽心神契约', rank: 'A', desc: '可契约强力神兽作为护卫灵宠' },
      { name: '乾坤袋纳物', rank: 'B', desc: '随身储物空间扩大十倍' },
    ],
  },
  {
    id: '01',
    name: '火影忍者 (木叶村忍者学校)',
    desc: '九尾之乱后的木叶村，忍界暗流涌动。宇智波一族覆灭边缘，晓组织暗中布局，中忍考试与尾兽风暴即将降临。',
    sRanks: '宇智波斑，千手柱间，宇智波鼬，六道仙人',
    identities: [
      { title: '忍者学校吊车尾下忍', rank: 'E', items: '苦无 x 3，手里剑 x 5' },
      { title: '暗部面具预备役', rank: 'C', items: '查克拉短刃，起爆符 x 3' },
      { title: '宇智波分家遗孤', rank: 'D', items: '家族团扇徽章，眼药水' },
    ],
    originTalents: [
      { name: '转生轮回创世体', rank: 'UR', desc: '天生双眼契合仙人体与仙人眼，查克拉无限流转' },
      { name: '飞雷神时空间瞬身', rank: 'SS', desc: '可在所有精神标记处瞬间传送位移' },
      { name: '尾兽人柱力查克拉', rank: 'S', desc: '体内封印浩瀚尾兽查克拉外衣' },
      { name: '万花筒写轮眼觉醒', rank: 'S', desc: '瞳术幻术与天照黑炎破限' },
      { name: '查克拉形态变化极致', rank: 'A', desc: '无印施展高阶忍术与螺旋丸' },
      { name: '替身术神级反应', rank: 'B', desc: '受到致命伤时自动以圆木替身互换' },
    ],
  },
]

// 全局通用与异界天赋库
export const GLOBAL_TALENTS: Talent[] = [
  { name: '虚数空间降临', rank: 'UR', desc: '可从虚数位面抽取无尽物质与反物质概念武器' },
  { name: '超低消耗无限重生', rank: 'UR', desc: '宿主核心权能：死后推演万千死局破局生路' },
  { name: '因果律逆命修正', rank: 'SSS', desc: '每场副本可强制逆转一次既定死亡因果' },
  { name: '基因锁四阶高·入微掌控', rank: 'SSS', desc: '微观分子级掌控自身肉体与能量循环，几近不灭之身' },
  { name: '心灵之光·AT绝对领域', rank: 'SS', desc: '意志化为绝对防御屏障，破灭万物法则' },
  { name: '纳米机械虫集群寄生', rank: 'SS', desc: '伤势瞬间以纳米重组愈合，百毒不侵' },
  { name: '诛仙剑意残片', rank: 'SS', desc: '攻击附带无上杀伐道果，斩断超凡护盾' },
  { name: '绝对冷酷心智', rank: 'S', desc: '绝对免疫B级及以下精神威慑与恐惧幻象，理智权衡因果' },
  { name: '基因锁一阶觉醒', rank: 'S', desc: '濒死触发远古战斗本能，思维感知加速300%' },
  { name: '危险直觉雷达', rank: 'S', desc: '在遭遇致命危机前10秒触发心跳警报' },
  { name: '快速神经反射', rank: 'A', desc: '身体神经反应速度超越常人极限两倍' },
  { name: '钢铁骨骼强化', rank: 'A', desc: '骨骼密度堪比钛合金，抗冲击与钝击提升' },
  { name: '潜伏行者潜行', rank: 'A', desc: '移动声响归零，在阴影中呼吸隐匿' },
  { name: '语言大师全通', rank: 'B', desc: '能听懂并讲说诸天任意位面的本土语言' },
  { name: '敏锐五感洞察', rank: 'B', desc: '视力与听力覆盖范围提升200%' },
  { name: '顽强生命韧性', rank: 'B', desc: '失血耐受力提升，不易陷入昏迷休克' },
]

export const RANK_COLORS: Record<string, string> = {
  UR: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 font-black animate-pulse',
  SSS: 'text-rose-500 font-black',
  SS: 'text-amber-400 font-black',
  S: 'text-purple-400 font-bold',
  A: 'text-sky-400 font-semibold',
  B: 'text-emerald-400 font-normal',
}

export const RANK_BADGES: Record<string, string> = {
  UR: 'border-pink-500 bg-pink-950/60 text-pink-300 shadow-[0_0_8px_#ec4899]',
  SSS: 'border-rose-500 bg-rose-950/60 text-rose-300 shadow-[0_0_8px_#f43f5e]',
  SS: 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-[0_0_8px_#f59e0b]',
  S: 'border-purple-400 bg-purple-950/60 text-purple-300 shadow-[0_0_6px_#c084fc]',
  A: 'border-sky-400 bg-sky-950/60 text-sky-300',
  B: 'border-emerald-400 bg-emerald-950/60 text-emerald-300',
}

interface WorldAccessModalProps {
  isOpen: boolean
  onClose: () => void
  onLaunch: (launchMessage: string) => void
  isInline?: boolean
}

export const WorldAccessModal: React.FC<WorldAccessModalProps> = ({
  isOpen,
  onClose,
  onLaunch,
  isInline = false,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'mode' | 'world' | 'export'>('world')

  // 宿主个人档案
  const [profile, setProfile] = useState({
    name: '李逍遥',
    gender: '男',
    age: '20',
    appearance: '一袭黑衣，眼神冷冽如刀',
    personality: '极致理智、善于洞察微末因果',
    xp: '超低消耗无限重生系统',
    others: '善于暗中布局与死局翻盘',
  })

  // 开局模式
  const [mode, setMode] = useState('全新攻略者')
  const modeOptions = [
    { title: '全新攻略者', desc: '初入诸天，身份普通，无特权加成，故事完全从零开始。' },
    { title: '重生者', desc: '携带前世因果与灾难记忆归来，熟知副本世界线关键节点。' },
    { title: '夺舍降临者', desc: '直接替换当前位面某个已知剧情配角或小反派的身躯与人脉。' },
    { title: '系统特权宿主', desc: '自带系统后门，初始可推演一次当前死局的破局点。' },
  ]

  // 当前选中的世界
  const [currentWorldIndex, setCurrentWorldIndex] = useState(0)
  const currentWorld = PRESET_WORLDS[currentWorldIndex] || PRESET_WORLDS[0]

  // 自定义世界编辑弹窗
  const [isCustomWorld, setIsCustomWorld] = useState(false)
  const [customWorld, setCustomWorld] = useState<WorldConfig>({
    id: '999',
    name: '自建超维位面',
    desc: '自定义的法则世界，万法随心构造。',
    sRanks: '虚空主宰，时空管理员',
    identities: [
      { title: '位面异邦旅人', rank: 'E', items: '破损的旅者披风，一枚未知合金硬币' },
    ],
    originTalents: [
      { name: '虚空折跃直感', rank: 'S', desc: '可短距离闪烁避开物理轰击' },
    ],
  })

  // 躯壳适配状态
  const [selectedIdentity, setSelectedIdentity] = useState(currentWorld.identities[0])

  // 天赋抽卡系统
  const [pulledOrigin, setPulledOrigin] = useState<Talent[]>(currentWorld.originTalents)
  const [pulledGeneral, setPulledGeneral] = useState<Talent[]>(GLOBAL_TALENTS.slice(0, 12))
  const [pullCount, setPullCount] = useState(0)
  const [showDirectPicker, setShowDirectPicker] = useState(false)

  // 选中的天赋（本源最多2个，通用最多3个）
  const [selectedOriginTalents, setSelectedOriginTalents] = useState<Talent[]>([])
  const [selectedGeneralTalents, setSelectedGeneralTalents] = useState<Talent[]>([])

  // 当切换世界时更新身份和本源天赋池
  const handleSelectWorld = (index: number) => {
    setCurrentWorldIndex(index)
    const w = PRESET_WORLDS[index]
    setSelectedIdentity(w.identities[0])
    setPulledOrigin(w.originTalents)
    setSelectedOriginTalents([])
  }

  // 🎲 随机适配身份
  const handleRandomIdentity = () => {
    const list = isCustomWorld ? customWorld.identities : currentWorld.identities
    const rand = list[Math.floor(Math.random() * list.length)]
    setSelectedIdentity(rand)
  }

  // 🎲 抽取天赋池（18连抽，带保底计算）
  const handlePull18 = () => {
    const nextCount = pullCount + 18
    setPullCount(nextCount)

    // 本源固定6个（洗牌）
    const originPool = isCustomWorld ? customWorld.originTalents : currentWorld.originTalents
    const shuffledOrigin = [...originPool].sort(() => 0.5 - Math.random())

    // 通用池12连抽
    const allGeneral = [...GLOBAL_TALENTS]
    const shuffledGeneral = allGeneral.sort(() => 0.5 - Math.random()).slice(0, 12)

    // 保底检查
    if (nextCount >= 50) {
      shuffledGeneral[0] = { name: '【保底UR】虚数维度降临', rank: 'UR', desc: '保底触发：无尽概念兵刃投射' }
    } else if (nextCount >= 20) {
      shuffledGeneral[0] = { name: '【保底SSS】因果律逆命修正', rank: 'SSS', desc: '保底触发：逆转必死因果' }
    } else if (nextCount >= 10) {
      shuffledGeneral[0] = { name: '【保底SS】心灵之光·绝对领域', rank: 'SS', desc: '保底触发：意志化为无上屏障' }
    } else if (nextCount >= 5) {
      shuffledGeneral[0] = { name: '【保底S】绝对冷酷心智', rank: 'S', desc: '保底触发：免疫一切精神恐惧' }
    }

    setPulledOrigin(shuffledOrigin)
    setPulledGeneral(shuffledGeneral)
  }

  // 选择/取消选择本源专属天赋 (max 2)
  const toggleOriginTalent = (talent: Talent) => {
    const exists = selectedOriginTalents.some(t => t.name === talent.name)
    if (exists) {
      setSelectedOriginTalents(selectedOriginTalents.filter(t => t.name !== talent.name))
    } else {
      if (selectedOriginTalents.length >= 2) return
      setSelectedOriginTalents([...selectedOriginTalents, talent])
    }
  }

  // 选择/取消选择通用天赋 (max 3)
  const toggleGeneralTalent = (talent: Talent) => {
    const exists = selectedGeneralTalents.some(t => t.name === talent.name)
    if (exists) {
      setSelectedGeneralTalents(selectedGeneralTalents.filter(t => t.name !== talent.name))
    } else {
      if (selectedGeneralTalents.length >= 3) return
      setSelectedGeneralTalents([...selectedGeneralTalents, talent])
    }
  }

  // 格式化降临启动消息
  const launchPayload = useMemo(() => {
    const activeW = isCustomWorld ? customWorld : currentWorld
    return `【诸天万界·宿主降临初始化协议】
1. 锚定位面：${activeW.id}.${activeW.name}
   - 核心背景：${activeW.desc}
   - 本位面S级存在：${activeW.sRanks}
2. 宿主灵魂档案：
   - 姓名: ${profile.name} ｜ 性别: ${profile.gender} ｜ 年龄: ${profile.age}
   - 外貌特征: ${profile.appearance}
   - 性格倾向: ${profile.personality}
   - 宿主特权系统: ${profile.xp} ｜ 潜在特质: ${profile.others}
   - 开局模式: ${mode}
3. 躯壳适配数据：
   - 身份: ${selectedIdentity.title} [评级: ${selectedIdentity.rank}]
   - 初始物资: ${selectedIdentity.items}
4. 激活本源专属天赋（${selectedOriginTalents.length}/2）：
${selectedOriginTalents.length > 0 ? selectedOriginTalents.map(t => `   - [${t.rank}] ${t.name}: ${t.desc}`).join('\n') : '   - 无（未激活本源天赋）'}
5. 激活异界与通用天赋（${selectedGeneralTalents.length}/3）：
${selectedGeneralTalents.length > 0 ? selectedGeneralTalents.map(t => `   - [${t.rank}] ${t.name}: ${t.desc}`).join('\n') : '   - 无（未激活通用天赋）'}

系统初始化完毕，世界线锚定牢固。请立即为宿主开启第一幕降临剧情，严格基于上述身世、物资与天赋生成开局死局或破局遭遇！`
  }, [currentWorld, customWorld, isCustomWorld, profile, mode, selectedIdentity, selectedOriginTalents, selectedGeneralTalents])

  const handleExecuteLaunch = () => {
    onLaunch(launchPayload)
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className={cn(
        'w-full max-w-4xl flex flex-col rounded-2xl border-2 border-cyan-500/80 shadow-[0_0_35px_rgba(6,182,212,0.35)] overflow-hidden text-gray-200',
        isInline ? 'my-1 max-h-[88vh] min-h-[620px]' : 'max-h-[92vh]',
      )}
      style={{
        backgroundColor: '#040812',
        backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.07) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* 顶部主导航 Tab 条 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#03060f]/90 border-b border-cyan-500/40">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              activeTab === 'profile'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
            )}
          >
            个人档案
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              activeTab === 'mode'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
            )}
          >
            开局模式
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('world')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1',
              activeTab === 'world'
                ? 'bg-cyan-500/25 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
            )}
          >
            <span>世界接入</span>
            <span className="text-[10px] text-cyan-400 font-mono">(6选1)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              activeTab === 'export'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
            )}
          >
            数据导出
          </button>
        </div>

        {isInline ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              首次降临·身份与世界初始化配置
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

        {/* 内容主体区域 (滚动) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: 个人档案 */}
          {activeTab === 'profile' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <h3 className="text-cyan-400 font-bold text-base flex items-center gap-2 border-b border-cyan-500/30 pb-2">
                <span>👤 宿主初始灵魂档案</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">姓名</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">性别</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="神秘无定">神秘无定</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">外貌特征</label>
                  <input
                    type="text"
                    value={profile.appearance}
                    onChange={e => setProfile({ ...profile, appearance: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">性格取向</label>
                  <input
                    type="text"
                    value={profile.personality}
                    onChange={e => setProfile({ ...profile, personality: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">核心特权/系统外挂</label>
                <input
                  type="text"
                  value={profile.xp}
                  onChange={e => setProfile({ ...profile, xp: e.target.value })}
                  className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">隐藏特质</label>
                <input
                  type="text"
                  value={profile.others}
                  onChange={e => setProfile({ ...profile, others: e.target.value })}
                  className="w-full px-3 py-2 bg-black/60 border border-cyan-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TAB 2: 开局模式 */}
          {activeTab === 'mode' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <h3 className="text-cyan-400 font-bold text-base flex items-center gap-2 border-b border-cyan-500/30 pb-2">
                <span>⚙️ 降临开局模式选择</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modeOptions.map(opt => (
                  <div
                    key={opt.title}
                    onClick={() => setMode(opt.title)}
                    className={cn(
                      'p-4 rounded-xl border-2 cursor-pointer transition-all',
                      mode === opt.title
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 bg-black/40 hover:border-white/30',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{opt.title}</span>
                      {mode === opt.title && <span className="text-cyan-400 font-bold">✓</span>}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 世界接入 (用户截图的核心功能区) */}
          {activeTab === 'world' && (
            <div className="space-y-5">
              {/* 工具条：自定义世界 + 快速探测世界 */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-500/30">
                <button
                  type="button"
                  onClick={() => setIsCustomWorld(!isCustomWorld)}
                  className="px-3.5 py-1.5 rounded-lg border border-cyan-400/80 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-bold text-xs tracking-wider shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span>🛠️</span>
                  <span>{isCustomWorld ? '切回预设位面' : '自定义世界（全能模式）'}</span>
                </button>

                <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
                  <span className="text-[11px] text-gray-400 mr-1 shrink-0">🎲 探测位面:</span>
                  {PRESET_WORLDS.map((w, idx) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWorld(idx)}
                      className={cn(
                        'px-2 py-1 rounded text-[11px] font-semibold shrink-0 transition-all',
                        currentWorldIndex === idx && !isCustomWorld
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                          : 'bg-black/50 text-gray-400 hover:text-white border border-white/5',
                      )}
                    >
                      {w.id}. {w.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1: 位面展示卡 */}
              <div className="p-4 rounded-xl border border-cyan-500/60 bg-[#081226]/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-wide">
                    {isCustomWorld ? `${customWorld.id}. ${customWorld.name}` : `${currentWorld.id}. ${currentWorld.name}`}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-2.5">
                  {isCustomWorld ? customWorld.desc : currentWorld.desc}
                </p>

                <div className="text-xs font-semibold">
                  <span className="text-rose-500 font-bold">S级存在：</span>
                  <span className="text-rose-400">{isCustomWorld ? customWorld.sRanks : currentWorld.sRanks}</span>
                </div>
              </div>

              {/* Step 2: 躯壳适配 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-cyan-300 font-mono tracking-wider flex items-center gap-2">
                    <span>Step 2:</span>
                    <span>躯壳适配</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleRandomIdentity}
                    className="px-3 py-1 rounded-lg border border-cyan-400/80 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <span>🎲</span>
                    <span>随机适配身份</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-black/60 font-mono text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">身份：</span>
                    <span className="text-white font-bold">{selectedIdentity.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/60 text-cyan-300 border border-cyan-400/50">
                      [{selectedIdentity.rank}]
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-400">物资：</span>
                    <span>{selectedIdentity.items}</span>
                  </div>
                </div>
              </div>

              {/* Step 3: 天赋加载 */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-cyan-300 font-mono tracking-wider flex items-center gap-2">
                    <span>Step 3:</span>
                    <span>天赋加载</span>
                  </h3>
                </div>

                {/* 保底机制说明 Banner */}
                <div className="p-3 rounded-xl border border-cyan-500/30 bg-black/40 text-[11px] text-gray-300 leading-relaxed font-mono space-y-1">
                  <div>
                    <span className="text-yellow-400">保底机制：</span>
                    每5抽必出S，每10抽必出SS，每20抽必出SSS，每50抽必出UR（彩色）。
                    <span className="ml-2 text-cyan-400">已累计抽取: {pullCount} 次</span>
                  </div>
                  <div>
                    <span className="text-sky-400">规则：</span>
                    本源专属天赋 6 选 2，异界+通用天赋 12 选 3。
                  </div>
                  <div className="text-gray-400">
                    可点「🔍 指定天赋」直接挑选任意天赋；已选天赋点 ✕ 可移除。
                  </div>
                </div>

                {/* 抽卡动作按钮 */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePull18}
                    className="flex-1 py-2 px-4 rounded-xl border-2 border-cyan-400 bg-gradient-to-r from-cyan-950 via-cyan-900/70 to-cyan-950 hover:brightness-125 text-cyan-200 font-black text-xs tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5 transition-all active:scale-98"
                  >
                    <span>🎲</span>
                    <span>抽取天赋池 (18连抽)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDirectPicker(!showDirectPicker)}
                    className="py-2 px-4 rounded-xl border border-amber-400/80 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-bold text-xs tracking-wide shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <span>🔍</span>
                    <span>{showDirectPicker ? '关闭挑选' : '指定天赋（直接挑选，不用抽）'}</span>
                  </button>
                </div>

                {/* 已选天赋状态栏 */}
                <div className="p-3 rounded-xl border border-cyan-500/40 bg-[#081222]/80 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-300 font-bold shrink-0">
                      已选专属 ({selectedOriginTalents.length}/2):
                    </span>
                    {selectedOriginTalents.length === 0 ? (
                      <span className="text-gray-500 italic">无</span>
                    ) : (
                      selectedOriginTalents.map(t => (
                        <span
                          key={t.name}
                          onClick={() => toggleOriginTalent(t)}
                          className="px-2 py-0.5 rounded-lg border border-purple-400 bg-purple-950/70 text-purple-200 cursor-pointer hover:bg-red-950/60 hover:border-red-400 hover:text-red-300 transition-all flex items-center gap-1 shadow-sm"
                          title="点击移除"
                        >
                          <span className="font-bold">[{t.rank}] {t.name}</span>
                          <span className="text-red-400 text-xs font-bold">✕</span>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-300 font-bold shrink-0">
                      已选通用 ({selectedGeneralTalents.length}/3):
                    </span>
                    {selectedGeneralTalents.length === 0 ? (
                      <span className="text-gray-500 italic">无</span>
                    ) : (
                      selectedGeneralTalents.map(t => (
                        <span
                          key={t.name}
                          onClick={() => toggleGeneralTalent(t)}
                          className="px-2 py-0.5 rounded-lg border border-cyan-400 bg-cyan-950/70 text-cyan-200 cursor-pointer hover:bg-red-950/60 hover:border-red-400 hover:text-red-300 transition-all flex items-center gap-1 shadow-sm"
                          title="点击移除"
                        >
                          <span className="font-bold">[{t.rank}] {t.name}</span>
                          <span className="text-red-400 text-xs font-bold">✕</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 1. 本源专属天赋卡池 (固定 6 个) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>✦</span>
                    <span>本源天赋 (本世界专属 - 固定6个 · 可选2个)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {pulledOrigin.map(t => {
                      const isSelected = selectedOriginTalents.some(sel => sel.name === t.name)
                      return (
                        <div
                          key={t.name}
                          onClick={() => toggleOriginTalent(t)}
                          className={cn(
                            'p-2.5 rounded-xl border transition-all cursor-pointer select-none relative',
                            isSelected
                              ? 'border-purple-400 bg-purple-950/60 shadow-[0_0_12px_rgba(192,132,252,0.4)]'
                              : 'border-white/10 bg-black/50 hover:border-cyan-500/50 hover:bg-black/70',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-xs font-bold', RANK_COLORS[t.rank] || 'text-white')}>
                              [{t.rank}] {t.name}
                            </span>
                            {isSelected && <span className="text-purple-300 font-bold text-xs">✓ 已选</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 leading-tight line-clamp-2">{t.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2. 异界与通用天赋卡池 (固定 12 个) */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>✦</span>
                    <span>异界与通用天赋 (12个 · 可选3个)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {pulledGeneral.map((t, idx) => {
                      const isSelected = selectedGeneralTalents.some(sel => sel.name === t.name)
                      return (
                        <div
                          key={`${t.name}-${idx}`}
                          onClick={() => toggleGeneralTalent(t)}
                          className={cn(
                            'p-2.5 rounded-xl border transition-all cursor-pointer select-none relative',
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'border-white/10 bg-black/50 hover:border-cyan-500/50 hover:bg-black/70',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-xs font-bold', RANK_COLORS[t.rank] || 'text-white')}>
                              [{t.rank}] {t.name}
                            </span>
                            {isSelected && <span className="text-cyan-300 font-bold text-xs">✓ 已选</span>}
                          </div>
                          <p className="text-[11px] text-gray-400 leading-tight line-clamp-2">{t.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 数据导出与预览 */}
          {activeTab === 'export' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <h3 className="text-cyan-400 font-bold text-base flex items-center gap-2 border-b border-cyan-500/30 pb-2">
                <span>📋 降临协议数据预览</span>
              </h3>
              <p className="text-xs text-gray-400">
                点击下方「启动降临」将直接把这段经过装配的完整角色数据作为第一幕指令注入给游戏大模型：
              </p>
              <pre className="p-4 bg-black/80 rounded-xl border border-cyan-500/40 text-cyan-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                {launchPayload}
              </pre>
            </div>
          )}
        </div>

        {/* 底部固定操作栏 */}
        <div className="shrink-0 p-4 bg-[#03060f]/95 border-t border-cyan-500/40 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400 hidden sm:block">
            当前就绪：<span className="text-cyan-300 font-bold">{isCustomWorld ? customWorld.name : currentWorld.name}</span>
            <span className="mx-1.5">|</span>
            <span>已配专属 {selectedOriginTalents.length}/2</span>
            <span className="mx-1.5">|</span>
            <span>已选通用 {selectedGeneralTalents.length}/3</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isInline ? (
              <button
                type="button"
                onClick={handleExecuteLaunch}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 transition-all"
                title="使用默认初始配置直接启动降临"
              >
                ⚡ 默认身份直接降临
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                稍后配置
              </button>
            )}
            <button
              type="button"
              onClick={handleExecuteLaunch}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.5)] tracking-wider transition-all"
            >
              🚀 锚定世界，启动降临！
            </button>
          </div>
        </div>
      </div>
  )

  if (isInline) {
    return (
      <div className="w-full flex justify-center py-2 px-1">
        {modalContent}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      {modalContent}
    </div>
  )
}

export default WorldAccessModal
