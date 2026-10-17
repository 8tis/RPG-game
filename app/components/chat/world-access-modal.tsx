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

// 预设《无限恐怖》世界书六大经典主神位面
export const PRESET_WORLDS: WorldConfig[] = [
  {
    id: '01',
    name: '生化危机一 (蜂巢·激光通道)',
    desc: '蜂巢地下实验所已彻底沦陷，红后智能主脑锁死基地，复仇邪神与爬行者潜伏在黑暗通风管。中洲队轮回者初次降临激光通道前夕。',
    sRanks: '激光防御矩阵主脑，爬行者母体，复仇邪神暴君，主神监视光球',
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
    id: '02',
    name: '异形一 (诺斯托罗莫号·幽闭深空)',
    desc: '深空商业货运飞船接收到未知地外信号。抱脸虫破卵，成熟期异形在黑暗通风管中潜伏猎杀。飞船主脑“母亲”冷酷执行维兰德公司灭绝协议。',
    sRanks: '异形皇后，生化人主教，飞船主脑“母亲”，终极成熟体异形',
    identities: [
      { title: '诺斯托罗莫号货船三副', rank: 'D', items: '船载应急钥匙卡，战术高光手电' },
      { title: '维兰德-尤坦尼外勤技工', rank: 'C', items: '工业切割喷枪，多功能工程扳手' },
      { title: '深空采矿外围杂工', rank: 'E', items: '压缩干粮袋，工装防尘风镜' },
      { title: '商业飞船安保队员', rank: 'C', items: '穿甲战术霰弹枪，运动声纳探测仪' },
    ],
    originTalents: [
      { name: '强酸血液绝对免疫', rank: 'SS', desc: '身体对异形高浓度分子强酸腐蚀完全免疫' },
      { name: '异形幼体寄生排斥', rank: 'S', desc: '体内细胞排斥一切抱脸虫胚胎，绝不破胸' },
      { name: '主脑母亲权限覆盖', rank: 'S', desc: '获知飞船深层管线密码与自爆程序管理权' },
      { name: '幽闭声呐回响感知', rank: 'A', desc: '在无光密闭管道中能凭微弱震动锁定异形坐标' },
      { name: '深空真空短时耐受', rank: 'A', desc: '在失压极寒环境中可维持行动力5分钟' },
      { name: '管道狭窄极速穿梭', rank: 'B', desc: '在通风管道内攀爬移动速度提升100%' },
    ],
  },
  {
    id: '03',
    name: '咒怨 (东京极凶之宅·无解死咒)',
    desc: '东京都练马区极凶死宅。凡踏足此地沾染因果者，皆被怨灵伽椰子与佐伯俊雄永无止境地索魂索命。不可名状灵异死咒蔓延，被窝、镜面无处可逃。',
    sRanks: '怨灵伽椰子真身，鬼童佐伯俊雄，地缚极恶因果场，无解死咒领域',
    identities: [
      { title: '警视厅搜查一课刑警', rank: 'D', items: '警用新南部M60左轮，绝密凶宅调查档案' },
      { title: '练马区探灵高校生', rank: 'E', items: '智能手机（录音中），便携录音笔' },
      { title: '远山警部外勤助手', rank: 'C', items: '破邪黑狗血瓶，折叠防暴棍' },
      { title: '浅草寺除灵俗家弟子', rank: 'C', items: '开光百年桃木剑，朱砂破煞符咒 x 3' },
    ],
    originTalents: [
      { name: '纯阳童子浩然血', rank: 'SS', desc: '全身血液如烈火灼热，怨灵阴爪触碰即被灼烧溃散' },
      { name: '阴阳灵视看破幻障', rank: 'S', desc: '双眼洞穿怨灵伪装与空间鬼打墙，不入幻境' },
      { name: '死兆因果律迟滞', rank: 'S', desc: '遭受伽椰子致命必死袭击时，强制延迟3秒生效' },
      { name: '梵音净心精神屏障', rank: 'A', desc: '免疫怨灵尖叫与恐惧精神侵蚀，神志永不崩溃' },
      { name: '玄门朱砂敕令手印', rank: 'A', desc: '指尖可凭空凌空画符，暂时定身幽魂鬼物' },
      { name: '夺命狂奔本能', rank: 'B', desc: '遭遇灵异威慑时移动速度提升150%，绝不绊倒' },
    ],
  },
  {
    id: '04',
    name: '神鬼传奇 (哈姆纳塔·亡者之城)',
    desc: '撒哈拉沙漠深处的黄沙亡灵古城。沉睡三千年的大祭司伊莫顿复苏，埃及十灾降临，黑衣守墓卫队与盗墓者激战，中洲队与印洲队团战因果在此引爆！',
    sRanks: '不死大祭司伊莫顿，蝎子王魔神化身，阿努比斯死神军团，亡灵圣经器灵',
    identities: [
      { title: '开罗开棺盗墓探险工兵', rank: 'E', items: '工兵铲，半壶烈酒，火把' },
      { title: '黑衣法老守墓卫队后裔', rank: 'C', items: '阿拉伯弯刀，驯鹰哨，沙漠斗篷' },
      { title: '大英博物馆古埃及学者', rank: 'D', items: '象形文字破译手册，古银质放大镜' },
      { title: '开罗美军雇佣兵斥候', rank: 'C', items: '汤姆逊冲锋枪，自制雷管炸药包 x 2' },
    ],
    originTalents: [
      { name: '亡灵黑经残卷通幽', rank: 'SS', desc: '可念诵古埃及死灵真言，役使木乃伊尸兵' },
      { name: '黄沙风暴瞬移同调', rank: 'S', desc: '在沙漠与沙尘环境中可化身沙尘瞬移数十米' },
      { name: '圣甲虫噬肉绝对抗性', rank: 'S', desc: '食人圣甲虫触体即避，免疫一切钻皮噬骨' },
      { name: '古埃及象形咒文直感', rank: 'A', desc: '瞬息解读所有法老王陵墓机关与石碑密咒' },
      { name: '炽热烈日与干渴耐受', rank: 'A', desc: '在极端沙漠环境中体力消耗降低80%' },
      { name: '双持枪斗重弹连射', rank: 'B', desc: '双枪射击精准度与装填速度大幅提升' },
    ],
  },
  {
    id: '05',
    name: '死神来了 (纽约死神名单·因果律死局)',
    desc: '180号航班空难阴影笼罩纽约。死神的名单绝不落空，微观松动的螺丝、燃气泄漏、高压水迹与飞溅钢索，整个现实世界的物理法则都化作无形索命的杀人机关！',
    sRanks: '无形死神因果律意志，死神黑名单收割场，现实概率修正场',
    identities: [
      { title: '180号航班预感生还者', rank: 'E', items: '登机牌存根，防风打火机' },
      { title: 'FBI超自然事故调查探员', rank: 'C', items: 'FBI证件，格洛克17手枪，连环卷宗' },
      { title: '纽约城市急救中心调度', rank: 'D', items: '对讲机，应急急救包，咖啡保温杯' },
      { title: '布鲁克林殡仪馆验尸学徒', rank: 'D', items: '医用解剖刀，防腐香水小喷壶' },
    ],
    originTalents: [
      { name: '死局因果连锁超维预知', rank: 'UR', desc: '遭遇死神连锁意外前3秒，视野中自动高亮死因物理链条' },
      { name: '微观概率因果偏转', rank: 'SS', desc: '当周围发生致命物理意外时，强行让物体偏离致命轨迹' },
      { name: '死神名单顺延逆命', rank: 'S', desc: '成功破解一次死神杀局后，获免死神追杀24小时' },
      { name: '机械隐患本能洞察', rank: 'A', desc: '一眼洞悉周围燃气、电线、易滑重物等全部环境杀机' },
      { name: '神经极限应激闪避', rank: 'A', desc: '面临高空坠物或爆炸飞片时做出非人极限规避' },
      { name: '心肺复苏自愈本能', rank: 'B', desc: '心跳骤停时神经电流自动自激复跳' },
    ],
  },
  {
    id: '06',
    name: '生化危机二 (浣熊市决战·恶魔队团战)',
    desc: '保护伞浣熊市全面沦陷，核弹倒计时进入终结倒计时！主神判定难度激增，轮回最强【恶魔小队】复制体郑吒跨位面降临狙杀，二十人死斗团战，生化炼狱绝境！',
    sRanks: '恶魔队复制体郑吒，追击者暴君终极变异体，保护伞核爆协议，恶魔队智者楚轩',
    identities: [
      { title: '中洲队二阶基因锁前哨', rank: 'C', items: '高斯手枪，一剂微型止痛喷雾' },
      { title: '浣熊市S.T.A.R.S特警队员', rank: 'D', items: '战术霰弹枪，警用防弹背心' },
      { title: '保护伞战术反击组内应', rank: 'C', items: 'EMP干扰手雷，保护伞加密撤离信标' },
      { title: '浣熊市平民地下向导', rank: 'E', items: '地下排污管网地图，撬棍' },
    ],
    originTalents: [
      { name: '基因锁潜能极速开启', rank: 'UR', desc: '濒死瞬间100%强制觉醒一阶并冲刺二阶基因锁' },
      { name: '黑炎毁灭暴戾抗性', rank: 'SS', desc: '对高阶心灵之光与恶魔队黑炎拥有极高抗性' },
      { name: '心灵之光·AT力场雏形', rank: 'S', desc: '意志化为微型护体屏障，可弹开小口径子弹与碎弹片' },
      { name: 'G病毒共生吞噬本能', rank: 'S', desc: '可吸收生化怪异血肉快速愈合重度创伤' },
      { name: '重火器战术入微压制', rank: 'A', desc: '操控重机枪或火箭炮时命中率与杀伤范围翻倍' },
      { name: '战场团战敌意雷达', rank: 'B', desc: '在周围50米内感知敌对轮回者杀意与热源' },
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
  onLaunch: (launchMessage: string, inputs?: Record<string, any>) => void
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
【系统输出格式约定】：
- 重要内容使用加粗（自动渲染为灵金色 #E3C362，只在有明确语义时出现）。
- 致命危险与状态警报标明「警告：...」或「不可逆风险/认知污染」（自动渲染为警示大红色 #FF3B3B）。
- 环境时间与位面坐标标明「星历/时间/坐标：...」（自动渲染为次要灰 #849396）。
- 核心回路与系统宣告标明「舰载核心/系统提示：...」（自动渲染为科技青 #70D8E0）。
- 每一幕剧情结束处，必须以「你要如何回应？」列出 2~4 条具体的行动指令分支！

系统初始化完毕，世界线锚定牢固。请立即为宿主开启第一幕降临剧情，严格基于上述身世、物资与天赋生成开局死局或破局遭遇！`
  }, [currentWorld, customWorld, isCustomWorld, profile, mode, selectedIdentity, selectedOriginTalents, selectedGeneralTalents])

  const handleExecuteLaunch = () => {
    const activeW = isCustomWorld ? customWorld : currentWorld
    onLaunch(launchPayload, {
      world_id: activeW.id,
      world_name: activeW.name,
      mode,
    })
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className={cn(
        'w-full max-w-4xl flex flex-col rounded-2xl border border-[#343b44] shadow-2xl overflow-hidden text-[#E6ECE8]',
        isInline ? 'my-1 max-h-[88vh] min-h-[620px]' : 'max-h-[92vh]',
      )}
      style={{
        backgroundColor: '#1a1d22',
      }}
    >
      {/* 顶部主导航 Tab 条 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#25292f] border-b border-[#363d47]">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              activeTab === 'profile'
                ? 'bg-[#1a1d22] text-[#70D8E0] border border-[#70D8E0]/40 shadow-xs'
                : 'text-[#849396] hover:text-[#E6ECE8] hover:bg-[#1a1d22]',
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
                ? 'bg-[#1a1d22] text-[#70D8E0] border border-[#70D8E0]/40 shadow-xs'
                : 'text-[#849396] hover:text-[#E6ECE8] hover:bg-[#1a1d22]',
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
                ? 'bg-[#1a1d22] text-[#70D8E0] border-2 border-[#70D8E0] shadow-[0_0_12px_rgba(112,216,224,0.3)]'
                : 'text-[#849396] hover:text-[#E6ECE8] hover:bg-[#1a1d22]',
            )}
          >
            <span>世界接入</span>
            <span className="text-[10px] text-[#70D8E0] font-mono">(6选1)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
              activeTab === 'export'
                ? 'bg-[#1a1d22] text-[#70D8E0] border border-[#70D8E0]/40 shadow-xs'
                : 'text-[#849396] hover:text-[#E6ECE8] hover:bg-[#1a1d22]',
            )}
          >
            数据导出
          </button>
        </div>

        {isInline ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1a1d22] text-[#70D8E0] border border-[#70D8E0]/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#88CBAA] animate-pulse"></span>
              首次降临·身份与世界初始化配置
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#849396] hover:text-[#E6ECE8] hover:bg-[#1a1d22] transition-colors"
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
                    className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">性别</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
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
                    className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">性格取向</label>
                  <input
                    type="text"
                    value={profile.personality}
                    onChange={e => setProfile({ ...profile, personality: e.target.value })}
                    className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">核心特权/系统外挂</label>
                <input
                  type="text"
                  value={profile.xp}
                  onChange={e => setProfile({ ...profile, xp: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1">隐藏特质</label>
                <input
                  type="text"
                  value={profile.others}
                  onChange={e => setProfile({ ...profile, others: e.target.value })}
                  className="w-full px-3 py-2 bg-[#081226] border border-cyan-500/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-[#0c1630]"
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
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                        : 'border-cyan-500/20 bg-[#081226]/80 hover:border-cyan-400/50 hover:bg-[#0c1630]',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{opt.title}</span>
                      {mode === opt.title && <span className="text-cyan-400 font-bold">✓</span>}
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-normal">{opt.desc}</p>
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
                  <span className="text-xs text-cyan-300 font-bold mr-1 shrink-0">🎲 探测位面:</span>
                  {PRESET_WORLDS.map((w, idx) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWorld(idx)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-semibold shrink-0 transition-all',
                        currentWorldIndex === idx && !isCustomWorld
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          : 'bg-[#081226] text-gray-200 hover:text-white hover:border-cyan-400/50 border border-cyan-500/30',
                      )}
                    >
                      {w.id}. {w.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1: 位面展示卡 */}
              <div className="p-4 rounded-xl border border-cyan-500/60 bg-[#081226]/90 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-wide">
                    {isCustomWorld ? `${customWorld.id}. ${customWorld.name}` : `${currentWorld.id}. ${currentWorld.name}`}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-100 font-normal leading-relaxed mb-2.5">
                  {isCustomWorld ? customWorld.desc : currentWorld.desc}
                </p>

                <div className="text-xs font-semibold">
                  <span className="text-rose-400 font-black">S级存在：</span>
                  <span className="text-rose-200 font-medium">{isCustomWorld ? customWorld.sRanks : currentWorld.sRanks}</span>
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

                <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-[#081226]/90 font-mono text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">身份：</span>
                    <span className="text-white font-bold">{selectedIdentity.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/60 text-cyan-300 border border-cyan-400/50">
                      [{selectedIdentity.rank}]
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">物资：</span>
                    <span className="text-gray-100 font-medium">{selectedIdentity.items}</span>
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
                <div className="p-3 rounded-xl border border-cyan-500/40 bg-[#081226]/90 text-xs text-gray-100 leading-relaxed font-mono space-y-1">
                  <div>
                    <span className="text-amber-300 font-bold">保底机制：</span>
                    每5抽必出S，每10抽必出SS，每20抽必出SSS，每50抽必出UR（彩色）。
                    <span className="ml-2 text-cyan-300 font-bold">已累计抽取: {pullCount} 次</span>
                  </div>
                  <div>
                    <span className="text-sky-300 font-bold">规则：</span>
                    本源专属天赋 6 选 2，异界+通用天赋 12 选 3。
                  </div>
                  <div className="text-gray-200 font-medium">
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
                    <span>{showDirectPicker ? '收起天赋宝库' : '指定天赋（直接挑选，不用抽）'}</span>
                  </button>
                </div>

                {/* 直接挑选面板 */}
                {showDirectPicker && (
                  <div className="p-3.5 rounded-xl border-2 border-amber-400/80 bg-[#08142b] space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>🔍 全局天赋宝库（点选直接装配为通用天赋）</span>
                      </span>
                      <span className="text-xs text-cyan-300 font-mono font-bold">
                        本源 {selectedOriginTalents.length}/2 ｜ 通用 {selectedGeneralTalents.length}/3
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                      {GLOBAL_TALENTS.map((t) => {
                        const isSelected = selectedGeneralTalents.some(sel => sel.name === t.name)
                        return (
                          <div
                            key={t.name}
                            onClick={() => toggleGeneralTalent(t)}
                            className={cn(
                              'p-2.5 rounded-xl border cursor-pointer select-none transition-all',
                              isSelected
                                ? 'border-amber-400 bg-amber-950/80 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                : 'border-cyan-500/20 bg-[#050b17] hover:border-amber-400/60 hover:bg-[#0c1630]',
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn('text-xs font-bold', RANK_COLORS[t.rank] || 'text-white')}>
                                [{t.rank}] {t.name}
                              </span>
                              {isSelected && <span className="text-amber-300 font-bold text-xs">✓ 已选</span>}
                            </div>
                            <p className="text-xs text-gray-200 leading-normal font-medium line-clamp-2">{t.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 已选天赋状态栏 */}
                <div className="p-3 rounded-xl border border-cyan-500/40 bg-[#081222]/80 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-300 font-bold shrink-0">
                      已选专属 ({selectedOriginTalents.length}/2):
                    </span>
                    {selectedOriginTalents.length === 0 ? (
                      <span className="text-gray-400 italic">无</span>
                    ) : (
                      selectedOriginTalents.map(t => (
                        <span
                          key={t.name}
                          onClick={() => toggleOriginTalent(t)}
                          className="px-2.5 py-1 rounded-lg border border-purple-400 bg-purple-950/80 text-purple-200 cursor-pointer hover:bg-red-950/60 hover:border-red-400 hover:text-red-300 transition-all flex items-center gap-1 shadow-sm"
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
                      <span className="text-gray-400 italic">无</span>
                    ) : (
                      selectedGeneralTalents.map(t => (
                        <span
                          key={t.name}
                          onClick={() => toggleGeneralTalent(t)}
                          className="px-2.5 py-1 rounded-lg border border-cyan-400 bg-cyan-950/80 text-cyan-200 cursor-pointer hover:bg-red-950/60 hover:border-red-400 hover:text-red-300 transition-all flex items-center gap-1 shadow-sm"
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
                              ? 'border-purple-400 bg-purple-950/70 shadow-[0_0_12px_rgba(192,132,252,0.4)]'
                              : 'border-cyan-500/25 bg-[#081020] hover:border-purple-400/60 hover:bg-[#0e1630]',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-xs font-bold', RANK_COLORS[t.rank] || 'text-white')}>
                              [{t.rank}] {t.name}
                            </span>
                            {isSelected && <span className="text-purple-300 font-bold text-xs">✓ 已选</span>}
                          </div>
                          <p className="text-xs text-gray-200 font-medium leading-relaxed line-clamp-2 mt-1">{t.desc}</p>
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
                              ? 'border-cyan-400 bg-cyan-950/70 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'border-cyan-500/25 bg-[#081020] hover:border-cyan-400/60 hover:bg-[#0e1630]',
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn('text-xs font-bold', RANK_COLORS[t.rank] || 'text-white')}>
                              [{t.rank}] {t.name}
                            </span>
                            {isSelected && <span className="text-cyan-300 font-bold text-xs">✓ 已选</span>}
                          </div>
                          <p className="text-xs text-gray-200 font-medium leading-relaxed line-clamp-2 mt-1">{t.desc}</p>
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
              <p className="text-xs text-gray-200 font-medium">
                点击下方「启动降临」将直接把这段经过装配的完整角色数据作为第一幕指令注入给游戏大模型：
              </p>
              <pre className="p-4 bg-[#081020] rounded-xl border border-cyan-500/50 text-cyan-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                {launchPayload}
              </pre>
            </div>
          )}
        </div>

        {/* 底部固定操作栏 */}
        <div className="shrink-0 p-4 bg-[#1a1d22] border-t border-[#343b44] flex items-center justify-between gap-3">
          <div className="text-xs text-[#849396] font-medium hidden sm:block">
            当前就绪：<span className="text-[#70D8E0] font-bold">{isCustomWorld ? customWorld.name : currentWorld.name}</span>
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#70D8E0] hover:text-white bg-[#25292f] hover:bg-[#2c333f] border border-[#363d47] hover:border-[#70D8E0]/50 transition-all"
                title="使用默认初始配置直接启动降临"
              >
                ⚡ 默认身份直接降临
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#849396] hover:text-[#E6ECE8] hover:bg-[#25292f] transition-colors"
              >
                稍后配置
              </button>
            )}
            <button
              type="button"
              onClick={handleExecuteLaunch}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-black text-xs text-[#12151a] bg-gradient-to-r from-[#70D8E0] via-[#88CBAA] to-[#70D8E0] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(112,216,224,0.4)] tracking-wider transition-all"
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
