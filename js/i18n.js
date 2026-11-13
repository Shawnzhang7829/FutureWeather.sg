/* Bilingual dictionary + applier.  Toggle with setLang('zh'|'en'). */
const I18N = {
  zh: {
    brand_sub: "Singapore climate projections and forecasts by subzone",
    flow_btn: "计算流程", help_btn: "说明", compare_btn: "多情景对比", charts_btn: "逐时曲线",
    bm_grey: "灰色底图", bm_sat: "Google 卫星",
    compare_title: "多情景地图对比", cmp_metric: "对比要素", cmp_panels: "面板数",
    dl_all_btn: "下载全部 EPW",
    dl_all_confirm: "将下载全部 EPW 的压缩包(332 subzone × 7 场景,解压后约 4.5GB,压缩包约 0.4–0.5GB)。确定继续吗?",
    mode_title: "downscaled data",       // after the highlighted "MSS V3" (.src-brand, user 2026-10-19)
    mode_tw: "月均温/风", mode_hot: "高温小时", mode_warm: "暖夜", mode_blank: "空白", fill_label: "着色",
    element: "显示要素", elem_temp: "气温", elem_wind: "风速",
    month: "月份", scenario_title: "场景 Scenario",
    year_title: "年份", year_hint: "仅 1995–2014 / 2040–2059 / 2080–2099 有数据",
    jurong: "仅 Jurong Gateway 范围", category: "UT&C 类别筛选",
    mr_title: "raw data（降尺度前）", mr_u_grid: "2 km 网格", mr_u_zone: "分区（强迫 EPW）", mr_var: "要素",
    mr_auto: "色标随月份自适应", mr_auto_tip: "打开：色标按当前地图（所选情景、年份或 20 年平均、月份）各格点 / 分区的最小–最大值拉伸，看得清空间差异；关闭：每个要素用一个固定色标（全部情景、年份、月份陆地格点的 p2–p98），便于比较不同月份、年份和情景。",
    mr_auto_on: "色标：当前地图的最小–最大值（随情景、年份、月份变化）", mr_auto_off: "色标：固定（全部情景、年份、月份共用）",
    mr_ol_zone: "显示分区轮廓", mr_ol_zone_tip: "在 2 km 网格上叠加 / 去掉 332 个 subzone 的边界线（悬停、选中和类别高亮不受影响）。",
    mr_ol_grid: "显示 2 km 网格轮廓", mr_ol_grid_tip: "在分区着色上叠加 / 去掉 2 km 网格：白色细线为格点边界，深色框为陆地格点，橙色虚线框为被分区使用的格点。",
    mr_legend_zone_plain: "降尺度前的强迫 EPW（20 年平均年）",
    mr_yr: "年份", mr_yr_sel: "所选年份", mr_yr_avg: "20 年平均", mr_period_avg: "20 年平均年",
    mr_on_tip: "打开后地图显示 MSS V3 降尺度前的数据（与上方 downscaled data 的着色二选一）。2 km 网格：MSS V3 SINGV-RCM 原始输出（NorESM2-MM 驱动），可看所选年份或 20 年平均；分区：降尺度前分配给各 subzone 的强迫 EPW，即离分区质心最近的 2 km 陆地格点的 20 年平均年。",
    mr_var_label: {t:"月均气温", rh:"月均相对湿度", w:"月均风速（10 m）", rad:"月均太阳辐射", rain:"月降水量", hot:"高温小时 (>35°C)", warm:"暖夜小时 (19–07时 >26.3°C)"},
    mr_hint_grid: "24 × 36 个 2 km 格点，随所选情景、年份、月份变化；深色细框为陆地格点（分区只会分配到这些格点）。",
    mr_hint_avg: "20 年逐时平均得到的平均年：降尺度前各分区的强迫 EPW 就是从这个场中取所在格点得到的，切到“分区”可直接对照。",
    mr_hint_zone: "各分区降尺度前的强迫 EPW（Forcing_epw）= 离质心最近的陆地格点的 20 年平均年，因此不随年份变化；橙色虚线框为被分区使用的格点。平均年会抹平极端值，高温小时、暖夜小时明显少于逐年值。",
    mr_legend_grid: "MSS V3 SINGV-RCM 2 km 原始输出（降尺度前）；深色框 = 陆地格点", mr_legend_zone: "降尺度前的强迫 EPW（20 年平均年）；深色框 = 陆地格点，橙色框 = 所用格点",
    mr_cell: (iy,ix,lat,lon,land,n)=>`格点 (${iy}, ${ix}) · ${lat}°N ${lon}°E · ${land ? "陆地" : "海上"}${n ? ` · 分配给 ${n} 个分区` : ""}`,
    mr_zone_cell: (iy,ix,lat,lon,km,moved)=>`降尺度前所用格点 (${iy}, ${ix}) · ${lat}°N ${lon}°E · 距质心 ${km} km${moved ? " · 2026-10-05 由海上格点改为陆地格点" : ""}`,
    ms_btn: "测距", ms_start: "起点", ms_total: "总长", ms_clear: "清除测量", ms_tip: "测量距离：在地图上依次单击添加点，每个点显示到该点为止的累计距离；双击或按 Esc 结束，退格键撤销上一个点，末端的 × 清除；再点一次本按钮开始新的测量。测量时地图的单击、双击功能暂停。",
    subzone_title: "Subzone 选择与下载", search_ph: "搜索 subzone，多个用逗号分隔（中英文逗号均可）…", search_multi: (n,k)=>`${k} 个关键词，找到 ${n} 个分区`, search_miss: s=>`未找到：${s}`,
    dl_selected: "下载所选 EPW", clear: "清空",
    mz_kind: "分区比较", mz_sub: n=>`比较 ${n} 个分区`, mz_counts_note: "各分区的高温小时、暖夜小时见窗口顶部表格",
    mz_cols: ["分区", "高温小时", "暖夜小时", "热浪天", "暖夜天"],
    mz_cols_tip: ["", "全年气温 >35°C 的小时数", "19:00–07:00 气温 >26.3°C 的小时数", "连续 ≥3 天日最高 ≥35°C 且日均 ≥29°C 的天数", "日最低气温 >26.3°C 的天数"],
    mz_over: (n, m)=>`已选 ${n} 个分区：超过 ${m} 个不做比较，这里显示最新选中的分区。`,
    mz_dropped: (name, m)=>`最多比较 ${m} 个：已自动取消最早选中的 ${name}。`,
    mz_how: "窗口内容与地图上选中的分区一致：在地图上普通单击只选中一个分区，Ctrl（Mac 为 ⌘）+ 单击可加入或移出（最多 6 个，再选会自动取消最早选中的那个）；左侧列表单击可加入或移出任意多个。选中 2–6 个时比较，地图上用对应曲线的颜色描边；超过 6 个时不比较，显示最新选中的分区。“清空”全部取消。悬停表格行可在地图上高亮该分区，双击缩放过去。",
    mz_need_single: "多个分区的比较需要在 Scenario 中选择单一情景。",
    mz_strip_hw: "底部色条 = 各分区的热浪天（自上而下同表格顺序）", mz_strip_wn: "底部色条 = 各分区的暖夜（自上而下同表格顺序）",
    charts_title: "逐时气候曲线", charts_hint: "点击地图或列表选择一个 subzone；选单一情景时 Ctrl + 单击可比较最多 6 个",
    data_note: "数据：MSS → UT&C 降尺度 · 332 subzone",
    flow_title: "计算流程", loading: "加载中…", no_data: "本年无数据",
    zoom_hint: "点击图片放大 / 还原 · 点背景关闭",
    tab_download: "EPW 下载", tab_figures: "形态与降尺度图",
    fig_canyon: "2D 街谷形态", fig_step2: "真实街区形态",
    fig_step3: "降尺度前后 ΔT / AH / LE（7 场景）",
    ds_loading: "正在读取 _npz_16 …",
    ds_avail: (n)=>`${n}/7 个场景 · 由 _npz_16 实时绘制`,
    ds_pending: (n)=>`其余 ${7-n} 个场景正在补算（UT&C），完成后会自动出现`,
    ds_bypass: "直接沿用类 subzone（未运行 UT&C 街谷模型）：ΔT ≡ 0，LE 未建模，AH 取自 step1 建筑原型",
    ds_noref: "缺少降尺度前参考数据，ΔT 暂不可用",
    ds_fallback: "动态数据不可用，显示静态图",
    ds_dt: "ΔT [°C]（T_canyon − T_forcing）", ds_ah: "AH (Qf_canyon) [W/m²]", ds_le: "LE [W/m²]（植被 + 湿路面）",
    ds_hour: "当地时刻（时）",
    legend_temp: "月均气温", legend_wind: "月均风速", legend_hot: "高温小时 (>35°C)",
    legend_warm: "暖夜小时 (19–07时 >26.3°C)",
    cat_all: "全部类别", scenario_all: "全部情景 All scenarios",
    map_single_hint: "地图按历史期着色；单击 subzone，图表窗口的日变化曲线会同时显示全部 7 个情景（全年、热浪、暖夜曲线需选择单一情景）。下载时包含全部情景。",
    click_download: "点击可查看/下载该 subzone 数据",
    no_selection: "未选择 subzone",
    diurnal_title: "年内逐时平均（24h 循环）",
    annual_title: "Annual Ta",
    temp_c: "气温 (°C)", rh: "相对湿度 (%)", wind_ms: "风速 (m/s)", ghi: "GHI (W/m²)",
    hot_hours_yr: "高温小时", hot_night_hours: "暖夜小时", hours: "小时",
    heatwave_title: "热浪天 Heatwave days", daily_max: "日最高气温", daily_mean_t: "日平均气温",
    is_heatwave: "是否热浪天", total_hw: "热浪总天数", days_unit: "天",
    warmnight_title: "暖夜日 Warm nights", daily_min: "日最低气温", is_warmnight: "是否暖夜", total_wn: "暖夜总天数",
    dl_one: "下载", dl_all_sc: "下载全部 7 场景 (zip)", dl_open: "打开下载窗口",
    am_lt: "长期预测", am_st: "短期预报",
    am_lt_tip: "长期预测：MSS 气候情景经 UT&C 降尺度到 subzone 的 1995–2099 气象数据与 EPW",
    am_st_tip: "短期预报：Google WeatherNext V3 集合预报（64 个成员的统计量），新加坡 0.05° / 0.1° 网格，逐时，覆盖最近 15 天",
    wn_title: "短期预报", wn_gridline: "网格",          // after the highlighted "WeatherNext V3" (.src-brand, user 2026-10-19)
    wn_gridline_tip: "打开：按 WeatherNext 网格显示（含网格边界）；关闭：332 个 subzone，每个分区取其覆盖格点的面积加权平均（权重 = 分区与格点相交的面积）",
    wn_zone_note: g=>`332 subzone · 格点面积加权 · ${g}`,
    wn_aw: (n,p,lat,lon)=>`面积加权 ${n} 个格点 · 最大权重 ${p}%（${lat}°N ${lon}°E）`,
    wn_grid: "网格", wn_var: "变量", wn_stat: "统计量",
    wn_grid_label: {"0p05":"0.05°（104 格点，站点校准）", "0p1":"0.1°（36 格点，全部变量）"},
    cmp_label: "对比实况（卷帘）", cmp_tip: "打开后地图中间出现可左右拖动的分隔线（双击中间的 ⇆ 可左右互换）：左边是预报，右边是同一时刻的实况——2 m 气温 / 露点 / 湿度用 ERA5-Land（0.1°，仅陆地）或 ERA5（0.25°），可切换；风、辐射、降水用 ERA5，圆点为 MSS 气象站实测；两边用同一色标。",
    cmp_fc: "预报", cmp_obs: "实况", cmp_src: {era5land:"ERA5-Land 再分析（0.1°）", era5:"ERA5 再分析（0.25°）"},
    cmp_show_era: "再分析（ERA5 / ERA5-Land）", cmp_show_st: "MSS 气象站", cmp_none: "已全部关闭",
    cmp_show_era_tip: "显示 / 关闭右侧的再分析着色（2 m 气温 / 露点 / 湿度为 ERA5-Land 或 ERA5，其余变量为 ERA5）。关闭后色标不再计入再分析的数值。",
    cmp_show_st_tip: "显示 / 关闭右侧的 MSS 气象站实测圆点。关闭后色标不再计入站点的数值。",
    cmp_era: "实况再分析", cmp_era_opt: {era5land:"ERA5-Land（0.1°，仅陆地）", era5:"ERA5（0.25°，含海面）"},
    cmp_era_tip: "2 m 气温 / 露点 / 湿度的实况可选两种再分析：ERA5-Land 0.1°，只有陆地，格点更细；ERA5 0.25°，含海面，格点更粗。两者都没有站点校准，城区通常比站点偏凉。",
    cmp_noera: "暂无 ERA5", cmp_st: n=>`${n} 个 MSS 站点`, cmp_st_one: "MSS 站点", cmp_st_note: "站点实测（逐时汇总）",
    cmp_aw: "面积加权", cmp_legend: "卷帘：左 = 预报，右 = 实况，同一色标",
    cmp_noera_msg: n=>`尚未下载 ERA5（需配置 CDS API）。${n>0 ? `右侧圆点为 ${n} 个 MSS 站点实测。` : n===0 ? "该变量 / 时刻也没有站点实测。" : ""}`,
    cmp_noera_hour: n=>`该时刻暂无 ERA5（ERA5 约晚 5 天发布）。${n>0 ? `右侧圆点为 ${n} 个 MSS 站点实测。` : n===0 ? "该变量 / 时刻也没有站点实测。" : ""}`,
    wn_fill: "填充色", wn_fill_tip: "显示 / 取消网格或分区的填充色。取消后只保留边界和海岸线，鼠标悬停仍可查看数值。",
    wn_auto: "色标随时刻自适应", wn_auto_tip: "打开：色标按当前时刻各格点的最小–最大值拉伸，看得清空间差异（同参考图）；关闭：整个预报期用同一色标，便于播放时比较不同时刻。",
    wn_auto_on: "色标：当前时刻的最小–最大值", wn_auto_off: "色标：整个预报期固定",
    wn_var_label: {t2m:"2 m 气温", d2m:"2 m 露点温度", rh:"2 m 相对湿度", ws10:"10 m 风速", u10:"10 m 风 u 分量（东向为正）",
      v10:"10 m 风 v 分量（北向为正）", ws100:"100 m 风速", u100:"100 m 风 u 分量（东向为正）", v100:"100 m 风 v 分量（北向为正）",
      ssrd:"地表太阳辐射（1 h 平均）", dsr:"地表直接辐射（1 h 平均）", tp:"降水（模型）", tp_imerg:"降水（IMERG 卫星校准）", tp_exp:"降水（试验版）"},
    wn_stat_label: {mean:"平均值", p10:"p10（第 10 百分位）", p25:"p25（第 25 百分位）", p50:"p50（中位数）", p75:"p75（第 75 百分位）", p90:"p90（第 90 百分位）"},
    wn_rh_note: "相对湿度只有一个值：由平均气温与平均露点按 Magnus 公式估算，没有百分位",
    wn_dry_note: "< 0.01 mm/h 的格点不着色",
    wn_st_main_tip: "显示 / 关闭 MSS 气象站逐时实测圆点：不开卷帘时叠加在预报图上，开启卷帘对比时显示在实况一侧。圆点与预报同一色标，并计入色标范围。只有 2 m 气温 / 露点 / 湿度、10 m 风和降水有站点数据。",
    wn_st_none: "该要素没有站点实测（站点只测气温、湿度、10 m 风和降水）",
    wn_view_st: "预报图上叠加了 MSS 气象站实测（圆点）。",
    wn_now_title: "当前数据", wn_view_now: s=>`当前视图：${s}。`, cmp_legend_help: f=>f ? "卷帘：左 = 实况，右 = 预报（已互换），同一色标。" : "卷帘：左 = 预报，右 = 实况，同一色标。",
    cmp_handle_tip: "拖动：移动分界线；双击：左右互换预报与实况",
    wn_info: (init,a,b,n)=>`最新起报 ${init}。时间轴 ${a} – ${b}，共 ${n} 次起报；每个时刻取覆盖它的最新一次起报（0–48 h 用中间起报，之后用主循环）。`,
    wn_init: (init,kind,lead)=>`起报 ${init} · ${kind} · 预报时效 +${lead} h`,
    wn_kind: {main:"主循环", intermediate:"中间起报"},
    wn_time_tip: "点击后可直接输入日期和时间（新加坡时间，按整点），回车确认、Esc 取消；超出时间轴的时刻会落到最近的一端。",
    wn_none: "该时刻无数据", wn_past: "已过去", wn_now_lbl: "现在", wn_play: "播放", wn_pause: "暂停", wn_speed_tip: "播放速度：1× = 每小时 0.45 s，2× / 4× 依次加快", wn_now_tip: "跳到当前时刻",
    wn_wday: ["周日","周一","周二","周三","周四","周五","周六"], wn_nodata: "未找到 WeatherNext 数据（data/wn3/）",
    dl_all_hint: "全部 332 subzone × 7 场景的 EPW 压缩包",
    help_wn: `<h4>短期预报（WeatherNext V3）</h4>
      <p>Google WeatherNext V3 是 AI 集合天气预报：每次起报计算 64 个成员（64 种可能的天气演变），Google 发布时已汇总为 6 个统计量——<b>平均值</b>与 <b>p10 / p25 / p50（中位数）/ p75 / p90</b>；p10–p90 越宽，预报越不确定。新加坡有两套网格：<b>0.05°</b>（104 个格点，经气象站观测校准，只有气温、露点、湿度）和 <b>0.1°</b>（36 个格点，全部要素）。</p>
      <table class="cat-tbl help-tbl"><thead><tr><th>要素</th><th>网格</th><th>单位</th><th>含义</th></tr></thead><tbody>
      <tr><td>2 m 气温</td><td>0.05° / 0.1°</td><td>°C</td><td>离地 2 m 的气温，整点瞬时值；0.05° 版经站点校准</td></tr>
      <tr><td>2 m 露点温度</td><td>0.05° / 0.1°</td><td>°C</td><td>空气冷却到饱和（结露）时的温度，越高越潮湿</td></tr>
      <tr><td>2 m 相对湿度</td><td>0.05° / 0.1°</td><td>%</td><td>不是直接预报的要素：由平均气温和平均露点按 Magnus 公式估算，只有一个值，没有百分位</td></tr>
      <tr><td>10 m 风速、u / v 分量</td><td>0.1°</td><td>m/s</td><td>离地 10 m 的风；u 东向为正，v 北向为正。风速单独统计，所以风速平均值一般不等于由 u、v 平均值合成的风速</td></tr>
      <tr><td>100 m 风速、u / v 分量</td><td>0.1°</td><td>m/s</td><td>离地 100 m 的风，接近高层建筑屋顶高度</td></tr>
      <tr><td>地表太阳辐射</td><td>0.1°</td><td>W/m²</td><td>到达地面的太阳短波总辐射（直射 + 散射），该小时平均</td></tr>
      <tr><td>地表直接辐射</td><td>0.1°</td><td>W/m²</td><td>其中太阳直射的部分，该小时平均</td></tr>
      <tr><td>降水（模型）</td><td>0.1°</td><td>mm/h</td><td>模型直接给出的该小时累计降水</td></tr>
      <tr><td>降水（IMERG 卫星校准）</td><td>0.1°</td><td>mm/h</td><td>按 NASA GPM IMERG 卫星降水校准的版本</td></tr>
      <tr><td>降水（试验版）</td><td>0.1°</td><td>mm/h</td><td>Google 标注为试验性的降水产品</td></tr>
      </tbody></table>
      <p>时间均为新加坡时间（SGT = UTC+8）。降水和辐射是一小时的累计 / 平均，标在时段结束时刻：14:00 表示 13:00–14:00。降水 &lt; 0.01 mm/h 的格点不着色。</p>
      <h4>显示与操作</h4>
      <p>左侧下拉菜单选择网格、要素和统计量。面板右上角的 <b>网格</b> 开关打开时按网格显示（含网格边界）；关闭时改为 332 个 subzone，每个分区取其覆盖格点的<b>面积加权平均</b>（权重 = 分区与各格点相交的面积，缺格点处按其余格点重新归一；与任何格点都不相交时才用最近格点）。鼠标悬停可看数值和 p10–p90 范围（分区模式下还显示参与加权的格点数和最大权重）。勾选 <b>MSS 气象站</b> 可在预报图上叠加站点逐时实测圆点（与预报同一色标，并计入色标范围；100 m 风和辐射没有站点数据）；开启卷帘对比时，圆点显示在实况一侧。</p>
      <p>底部时间条逐时移动：拖动滑块、‹ 1h / 1h › 或键盘 ← →；▶ 播放（1× / 2× / 4×）；⟲ 回到当前时刻；点击时间文字可直接输入日期和时间。每个时刻取覆盖它的最新一次起报：0–48 h 用最新的中间起报，之后用最新的主循环起报（00 / 06 / 12 / 18 UTC，预报 15 天）。数据每天自动下载 4 次并保留最近 15 天的起报，所以时间轴覆盖过去 15 天和未来 15 天。</p>
      <h4>对比实况（卷帘）</h4>
      <p>勾选后地图中间出现可左右拖动的分隔线：左边是预报，右边是同一时刻的实况，两边用同一色标；双击分隔线中间的 ⇆ 可把两边左右互换。实况有三类数据：再分析在卷帘选项里显示 / 关闭，站点由面板的 <b>MSS 气象站</b> 开关控制（关闭的一方不计入色标）。</p>
      <table class="cat-tbl help-tbl"><thead><tr><th>数据</th><th>分辨率 / 范围</th><th>对比的要素</th><th>说明</th></tr></thead><tbody>
      <tr><td><b>ERA5-Land</b><br>再分析</td><td>0.1°（约 9 km），只有陆地；<br>新加坡范围 32 格</td><td>2 m 气温、露点、湿度（默认）</td><td>ECMWF 用 ERA5 的近地面大气驱动、按更细的地形和下垫面重算的陆面数据，不另外同化观测；陆地上的空间细节比 ERA5 好，海面为空</td></tr>
      <tr><td><b>ERA5</b><br>再分析</td><td>0.25°（约 28 km），含海面；<br>新加坡范围 12 格</td><td>10 m / 100 m 风、地表太阳辐射与直接辐射、降水（三种降水预报都与它对比）；2 m 气温 / 露点 / 湿度可在 <b>实况再分析</b> 中切换为它</td><td>ECMWF 的全球再分析，同化卫星、探空、地面站等大量观测；格子大，一个格子常同时覆盖城区和海面，沿海格子偏凉、偏湿</td></tr>
      <tr><td><b>MSS 气象站</b><br>实测</td><td>站点（圆点），每天约 89–91 个；<br>18 个测气温 / 湿度，17–18 个测风，<br>其余为雨量站</td><td>2 m 气温、露点、湿度，10 m 风，降水（没有 100 m 风和辐射）</td><td>data.gov.sg 公开数据（NEA / 新加坡气象局）。逐分钟读数汇总为逐时：气温、湿度、风速取整点前后 30 分钟平均（风向取矢量平均），降水取整点前 1 小时累计，露点由气温和湿度算出</td></tr>
      </tbody></table>
      <p>两种再分析都约晚 5 天发布，所以较新的时刻右侧只有站点。分区模式下，再分析的分区值与预报一样按面积加权；站点始终以圆点显示。两种再分析都没有城市热岛的物理过程，也没有用新加坡站点校准，城区通常比站点偏凉：看城区实况以站点为准，再分析更适合看大范围的空间形态和天气过程。数据由 <code>download_singapore_era5.py</code>（Copernicus CDS）和 <code>download_singapore_stations.py</code> 下载到 WeatherNext 数据目录下的 <code>era5/</code>、<code>stations/</code>，均保留最近 15 天。</p>`,
    months: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    ssp_label: {historical:"历史", ssp126:"SSP1-2.6", ssp245:"SSP2-4.5", ssp585:"SSP5-8.5"},
    period_label: {"1995-2014":"历史 (1995–2014)","2040-2059":"世纪中 (2040–2059)","2080-2099":"世纪末 (2080–2099)"},
    cat_fill_on: "按类型着色显示 subzone", cat_fill_off: "恢复原来的着色", cat_fill_title: "Subzone 类型", cat_fill_lab: "类型",
    cat_fill_tip: "按类型着色：按每个 subzone 的类型（列表前圆点的颜色）给地图上的 subzone 填色，图例列出各类型及个数；再点一次恢复原来的着色。",
    cat_label: {utc:"UT&C 标准", crown_shrunk:"冠幅收缩", tree_shortened:"树高压低",
                tree_taller:"树高于建筑(透传)", no_building:"无建筑(透传)", crown_overshrunk:"冠幅过收缩"},
    nods_tip: "未降尺度（without downscaled）：原始 EPW 透传", nods_badge: "未降尺度（without downscaled）", cl_kind_zone: "分区", cl_kind_tip_z: "悬停：在地图上高亮该分区；单击：锁定 / 取消高亮；双击：地图缩放到该分区",
    cat_tab_hint: "选中一类后，地图上以与圆圈相同的颜色勾出该类全部分区的轮廓；选\"全部类别\"取消。",
    nods_sw_on: "显示", nods_sw_off: "已关闭", nods_sw_tip: "未降尺度分区开关: 关闭后，地图与列表中不再显示这 58 个未降尺度分区（UBEM.sg 中其建筑也不着色）；再次打开即恢复。",
    cat_tab_ds: "已降尺度（UT&C）", cat_tab_nods: "未降尺度（without downscaled，原始 EPW 透传）",
    jg_others: "显示范围外分区边界", jg_others_tip: "仅 Jurong Gateway 范围时，范围外的分区默认不显示；勾选后显示它们的边界（不着色、不能悬停或点选），取消勾选再隐藏。",
    sel_jurong: n=>`选取范围内全部分区（${n}）`, sel_jurong_tip: "把 Jurong Gateway 范围内的全部分区（面积 ≥5% 位于范围内）加入选择：地图上高亮轮廓，可用下方“下载所选 EPW”一并下载；已选的分区保留。关闭“未降尺度”开关时不含未降尺度分区。",
    sel_cat: n=>`选取本类（${n}）`, sel_cat_tip: "选取本类: 把当前列表中的全部分区加入选择（地图上高亮轮廓，可一并下载 EPW）；列表内容由上方类别选项卡与搜索框决定。",
    cat_tip_head: "圆圈颜色 = 分区类别（分类依据见 About）", cat_grp_ds: n=>`已降尺度（UT&C，${n} 个）`,
    cat_grp_nods: n=>`未降尺度 without downscaled（原始 EPW 透传，${n} 个）`, cat_ds: "已降尺度（UT&C）", cat_nods: "未降尺度（without downscaled），原始 EPW 透传",
    selected_n: (n)=>`已选 ${n} 个 · Ctrl（Mac 为 ⌘）+ 单击地图上的分区可加选或取消`,
    dl_zip_building: "正在打包 zip…", dl_server: (n, m)=>`下载已开始：本地服务器正在打包 ${n} 个分区 × ${m} 个情景，文件较大，进度见浏览器的下载栏。`,
    dl_done: "下载完成",
    help_html: `
      <p>本平台展示新加坡 332 个 subzone 经 <b>MSS → UT&C</b> 降尺度的气象数据，可在线浏览并下载 EPW 文件。</p>
      <h4>MSS V3 downscaled data · 地图显示模式</h4>
      <p>① <b>月均温/风</b>：选场景+年份+月份+要素，按 subzone 着色。<br>
         ② <b>高温小时</b>：选场景+年份，显示该年 >35°C 小时数。<br>
         ③ <b>暖夜</b>：选场景+年份，显示该年夜间（19:00–07:00）气温 >26.3°C 的小时数。暖夜指日最低气温高于 26.3°C 的夜晚，即整夜都没有降到 26.3°C 以下。<br>
         右上角<b>着色开关</b>可随时关闭/开启分区着色——关闭后仅显示底图与边界。</p>
      <h4>MSS V3 raw data（降尺度前）</h4><p>面板 <b>MSS V3 raw data</b> 打开后，地图改为显示降尺度之前的数据（与 downscaled data 的着色二选一）：<b>2 km 网格</b> 是 MSS V3 SINGV-RCM 的原始输出（NorESM2-MM 驱动，24 × 36 个格点，逐时数据汇总为月均气温、湿度、风速、太阳辐射、月降水量，以及每年的高温小时与暖夜小时），可看所选年份或 <b>20 年平均</b>；<b>分区（强迫 EPW）</b> 是降尺度前分配给各 subzone 的强迫 EPW（Forcing_epw）——离分区质心最近的 2 km <b>陆地</b>格点（2026-10-05 起只在陆地格点中选，此前 12 个沿海 / 岛屿分区曾落在海上格点）的 20 年平均年，所以不随年份变化。两者同源：20 年平均网格在某格点的值，就是使用该格点的分区的强迫 EPW 值（气温差 ≤ 0.05 °C，来自 EPW 一位小数的舍入；高温 / 暖夜小时在阈值附近也因此略有差别）。悬停格点可看坐标、是陆地还是海上、分配给了哪些分区；悬停分区可看它所用的格点和到质心的距离。两种方式下都可显示 / 关闭对方的轮廓：网格方式下勾选 <b>显示分区轮廓</b>，分区方式下勾选 <b>显示 2 km 网格轮廓</b>（白色细线为格点边界，深色框为陆地格点，橙色虚线框为被分区使用的格点）。勾选 <b>色标随月份自适应</b> 时，色标按当前地图的最小–最大值拉伸（随情景、年份、月份变化），看得清空间差异；取消勾选则每个要素用一个固定色标（全部情景、年份、月份陆地格点的 p2–p98），便于在不同月份、年份和情景之间比较颜色。</p>
      <h4>年份与范围</h4>
      <p>年份滑轨 1995–2099；仅 1995–2014 / 2040–2059 / 2080–2099 有数据，其余年份显示为透明空值。勾选"仅 Jurong Gateway 范围"可聚焦到该区域；范围指面积 ≥5% 位于 Jurong Gateway 内的 21 个分区（其中 1 个未降尺度）；勾选后可再选 <b>显示范围外分区边界</b>，显示其余分区的边界（不着色）。下方的 <b>选取范围内全部分区</b> 把这 21 个分区一次加入选择（关闭“未降尺度”开关时只选 20 个），可一并下载 EPW。</p>
      <h4>分区类别（列表圆圈颜色）</h4>
      <p>"Subzone 选择与下载"列表中每个分区前圆圈的颜色表示它的类别，由 <code>pipeline/bypass_filter.py</code> 按栅格提取的平均建筑高度 bh、平均树高 th 与树冠几何依次判定（自上而下，先满足者优先）。鼠标在圆圈、面板标题或类别选项卡上停留 1.5 s 会显示说明；点选项卡即按类别筛选列表，并在地图上以同色轮廓勾出该类分区。</p>
      <table class="cat-tbl"><thead><tr><th></th><th>类别</th><th>判定依据</th><th>降尺度</th><th>分区数</th></tr></thead><tbody><tr><td><i style="background:#9ca3af"></i></td><td>无建筑（透传）</td><td>土地覆盖栅格中没有建筑像元（bh = 0）；UT&C 需要非空的建筑掩膜</td><td class="no">否</td><td class="n">15</td></tr><tr><td><i style="background:#eab308"></i></td><td>树高于建筑（透传）</td><td>th ≥ 1.2 × bh：树冠主导街谷，UT&C“街谷内两棵树”的抽象不再成立</td><td class="no">否</td><td class="n">36</td></tr><tr><td><i style="background:#a855f7"></i></td><td>冠幅过收缩（透传）</td><td>为保证树冠底部离地 ≥ 0.3 m，树冠半径被压到原来的 1/5 以下（r_raw / r_final > 5），街谷形态退化（街谷过宽）</td><td class="no">否</td><td class="n">7</td></tr><tr><td><i style="background:#e64a19"></i></td><td>树高压低</td><td>bh < th < 1.2 × bh：树冠顶压到建筑高度以下 max(1% × bh, 0.3 m) 后运行 UT&C</td><td class="yes">是</td><td class="n">19</td></tr><tr><td><i style="background:#22c55e"></i></td><td>冠幅收缩</td><td>为保证树冠底部离地 ≥ 0.3 m 缩小了树冠半径（压缩不超过 5 倍），UT&C 照常运行</td><td class="yes">是</td><td class="n">22</td></tr><tr><td><i style="background:#3b82f6"></i></td><td>UT&C 标准</td><td>其余分区，按栅格形态直接运行 UT&C</td><td class="yes">是</td><td class="n">233</td></tr></tbody></table>
      <p>已降尺度 274 个，未降尺度 58 个；未降尺度分区在 <code>outputs/downscaled_epw</code> 中存放的是原始强迫 EPW 的拷贝（透传）。地图上鼠标悬停或选中这些分区时，轮廓为<b style="color:#d946ef">洋红色</b>（已降尺度分区为青色悬停、橙色选中）。</p>
      <h4>交互</h4>
      <p>鼠标悬停查看数值；<b>单击</b> subzone 只选中它，并在逐时曲线窗口中显示（逐时曲线与全年 Ta），<b>双击</b>打开该 subzone 的下载窗口与形态/降尺度图。左侧勾选 + 场景，可批量下载 EPW（个数不限）；<b>Ctrl</b>（Mac 为 ⌘）<b>+ 单击</b>地图上的分区可把它加入或移出选择；在 Scenario 中选单一情景时，逐时曲线窗口会叠加比较所选分区（最多 6 个：在地图上 Ctrl + 单击第 7 个时自动取消最早选中的那个；在左侧列表或用按钮选得更多时不做比较，显示最新选中的分区，所选分区统一为橙色轮廓），窗口顶部的表格列出各分区的高温小时、暖夜小时、热浪天和暖夜天，地图上被比较的分区用对应曲线的颜色描边。窗口内容始终与地图上选中的分区一致：在地图上普通单击只选中一个，左侧列表单击可加入或移出任意多个，“清空”全部取消。逐时曲线窗口里，Annual Ta 标出 35°C 与 26.3°C 两条线及对应小时数，下方依次为热浪天与暖夜日。这三张图都是全年时间轴，可用鼠标滚轮或下方滑块缩放，横坐标随之从月细化到日和小时。</p>
      <h4>顶部工具</h4>
      <p>顶部的 <b>长期预测 / 短期预报</b> 选项卡切换两类数据，本页只介绍长期预测；短期预报有单独的说明，切换到短期预报后再点 <b>说明</b> 查看。<b>多情景对比</b>（场景面板内）：2–4 个面板并排比较不同年份/场景的地图。<b>下载全部 EPW</b>（左侧底部）：一键下载全部 332×7 个 EPW 压缩包。右上角可切换 中/EN。逐时曲线窗口随单击 subzone 打开，右上角 × 关闭。<b>计算流程</b>图见本说明末尾（可点击放大）。</p>
      <h4>数据源</h4>
      <p>整图数值按所选<b>年份</b>直接取自 MSS <code>CSV_yearly</code>（模式1 = 该年逐月均值，模式2 = 该年 >35°C 小时数，模式3 = 该年夜间 >26.3°C 小时数；均为降尺度前数据；2026-10-05 起沿海分区改用最近的陆地格点）。MSS V3 raw data 面板的 2 km 网格取自 MSS V3 SINGV-RCM 逐时输出（<code>MSS/out/_cache</code>），分区值取自降尺度前的强迫 EPW（<code>Forcing_epw</code>），由 <code>web/prepare_mss_raw.py</code> 汇总。EPW 下载来自 UT&C 降尺度产物 <code>downscaled_epw</code>（未降尺度分区为强迫 EPW 的拷贝）；单 subzone 窗口的形态图为 <code>outputs/figures</code> 中的静态图，降尺度图由 <code>downscaled_epw/_npz_16</code>（UT&C 逐时街谷微气候，16 个变量）实时绘制。逐时曲线（含热浪天、暖夜统计）由所选降尺度 EPW 实时解析。Workshop 版的这些数据在 <code>Source data\\1_MSS_V3_长期预测</code>（<code>forcing_epw</code>、<code>downscaled_epw</code>）。短期预报的数据来源见短期预报的说明。</p>`,
  },
  en: {
    brand_sub: "Singapore climate projections and forecasts by subzone",
    flow_btn: "Workflow", help_btn: "About", compare_btn: "Compare scenarios", charts_btn: "Curves",
    bm_grey: "Grey map", bm_sat: "Satellite",
    compare_title: "Compare maps across scenarios", cmp_metric: "Metric", cmp_panels: "Panels",
    dl_all_btn: "Download all EPW",
    dl_all_confirm: "This downloads an archive of ALL EPW (332 subzones × 7 scenarios, ~4.5GB uncompressed, ~0.4–0.5GB archive). Continue?",
    mode_title: "downscaled data",       // after the highlighted "MSS V3" (.src-brand, user 2026-10-19)
    mode_tw: "Monthly T/Wind", mode_hot: "Hot hours", mode_warm: "Warm nights", mode_blank: "Blank", fill_label: "Fill",
    element: "Variable", elem_temp: "Air Temperature", elem_wind: "Wind speed",
    month: "Month", scenario_title: "Scenario",
    year_title: "Year", year_hint: "Data only for 1995–2014 / 2040–2059 / 2080–2099",
    jurong: "Jurong Gateway only", category: "UT&C category filter",
    mr_title: "raw data", mr_u_grid: "2 km grid", mr_u_zone: "Subzones (forcing EPW)", mr_var: "Variable",
    mr_auto: "Colour range per month", mr_auto_tip: "On: the colour range stretches over the min–max of the map now shown (selected scenario, year or 20-year mean, and month), so spatial differences show; off: one fixed range per variable (p2–p98 of the land points over all scenarios, years and months), to compare months, years and scenarios.",
    mr_auto_on: "range: min–max of this map (changes with scenario, year and month)", mr_auto_off: "range: fixed (shared by all scenarios, years and months)",
    mr_ol_zone: "Subzone outlines", mr_ol_zone_tip: "Adds / removes the boundaries of the 332 subzones over the 2 km grid (hover, selection and category highlights stay).",
    mr_ol_grid: "2 km grid outlines", mr_ol_grid_tip: "Adds / removes the 2 km grid over the subzone colours: thin white lines = grid cells, dark frames = land points, dashed orange frames = the points in use.",
    mr_legend_zone_plain: "Forcing EPW before downscaling (20-year average year)",
    mr_yr: "Year", mr_yr_sel: "Selected year", mr_yr_avg: "20-year mean", mr_period_avg: "20-year average year",
    mr_on_tip: "Shows MSS V3 before downscaling on the map (instead of the downscaled-data colouring above). 2 km grid: the MSS V3 SINGV-RCM output itself (NorESM2-MM driven), for the selected year or the 20-year mean; subzones: the forcing EPW each subzone was given before downscaling, the 20-year average year of the 2 km land grid point nearest to its centroid.",
    mr_var_label: {t:"Monthly mean temperature", rh:"Monthly mean relative humidity", w:"Monthly mean wind speed (10 m)", rad:"Monthly mean solar radiation", rain:"Monthly rainfall", hot:"Hot hours (>35°C)", warm:"Hot night hours (19–07h >26.3°C)"},
    mr_hint_grid: "24 x 36 points of 2 km, for the selected scenario, year and month; thin dark frames = land points (the only points a subzone can be given).",
    mr_hint_avg: "The average year of the 20 years' hourly data: each subzone's forcing EPW before downscaling was taken from this field at its grid point - switch to Subzones to compare.",
    mr_hint_zone: "Each subzone's forcing EPW before downscaling (Forcing_epw) = the 20-year average year of the land grid point nearest to its centroid, so it does not change with the year; dashed orange frames = the grid points in use. Averaging smooths the extremes: hot hours and hot night hours are far fewer than in single years.",
    mr_legend_grid: "MSS V3 SINGV-RCM 2 km output (before downscaling); dark frames = land points", mr_legend_zone: "Forcing EPW before downscaling (20-year average year); dark frames = land points, orange frames = points in use",
    mr_cell: (iy,ix,lat,lon,land,n)=>`Grid point (${iy}, ${ix}) · ${lat}°N ${lon}°E · ${land ? "land" : "sea"}${n ? ` · given to ${n} subzone(s)` : ""}`,
    mr_zone_cell: (iy,ix,lat,lon,km,moved)=>`Grid point before downscaling (${iy}, ${ix}) · ${lat}°N ${lon}°E · ${km} km from the centroid${moved ? " · moved from a sea point to a land point on 2026-10-05" : ""}`,
    ms_btn: "Measure", ms_start: "start", ms_total: "Total", ms_clear: "Clear the measurement", ms_tip: "Measure a distance: click the map to add points, each labelled with the distance so far; double-click or Esc ends, Backspace takes the last point back, the × at the end clears; click this button again for a new measurement. While measuring, the map's own clicks pause.",
    subzone_title: "Subzone selection & download", search_ph: "Search subzones - separate several with commas ( , or ， )…", search_multi: (n,k)=>`${k} terms, ${n} subzones found`, search_miss: s=>`Not found: ${s}`,
    dl_selected: "Download selected EPW", clear: "Clear",
    mz_kind: "Compare", mz_sub: n=>`${n} subzones compared`, mz_counts_note: "hot hours and hot night hours of each subzone: table at the top",
    mz_cols: ["Subzone", "Hot h", "Hot night h", "Heatwave d", "Warm nights"],
    mz_cols_tip: ["", "hours above 35°C in the year", "hours above 26.3°C between 19:00 and 07:00", "days in runs of >= 3 days with daily max >= 35°C and daily mean >= 29°C", "days with a daily minimum above 26.3°C"],
    mz_over: (n, m)=>`${n} subzones selected: more than ${m} are not compared - the most recently selected one is shown here.`,
    mz_dropped: (name, m)=>`At most ${m} are compared: ${name}, the earliest selected, was deselected.`,
    mz_how: "The window shows the subzones selected on the map: on the map a plain click selects just one subzone and Ctrl (⌘ on Mac) + click adds or removes one (at most 6 - one more deselects the earliest selected); in the list a click adds or removes any number. 2-6 selected are compared and outlined on the map in their curve colours; with more than 6 there is no comparison and the most recently selected is shown. Clear deselects all. Hover a table row to highlight the subzone on the map, double-click to zoom to it.",
    mz_need_single: "To compare several subzones, choose a single scenario under Scenario.",
    mz_strip_hw: "bottom strips = heatwave days of each subzone (top to bottom as in the table)", mz_strip_wn: "bottom strips = warm nights of each subzone (top to bottom as in the table)",
    charts_title: "Hourly climate curves", charts_hint: "Click a subzone on the map or list; with one scenario, Ctrl + click compares up to 6",
    data_note: "Data: MSS → UT&C downscaling · 332 subzones",
    flow_title: "Computation workflow", loading: "Loading…", no_data: "No data this year",
    zoom_hint: "Click image to zoom / reset · click background to close",
    tab_download: "EPW download", tab_figures: "Morphology & downscaling",
    fig_canyon: "2D street-canyon abstraction", fig_step2: "Real urban morphology",
    fig_step3: "Pre/post ΔT, AH, LE (7 scenarios)",
    ds_loading: "Reading _npz_16 …",
    ds_avail: (n)=>`${n}/7 scenarios · drawn live from _npz_16`,
    ds_pending: (n)=>`the other ${7-n} are being computed (UT&C backfill) and will appear automatically`,
    ds_bypass: "Passthrough subzone (no UT&C canyon run): ΔT ≡ 0, LE not modeled, AH from step-1 archetypes",
    ds_noref: "pre-downscaling reference missing — ΔT unavailable",
    ds_fallback: "Live data unavailable — showing the static figure",
    ds_dt: "ΔT [°C] (T_canyon − T_forcing)", ds_ah: "AH (Qf_canyon) [W/m²]", ds_le: "LE [W/m²] (veg + wet pavement)",
    ds_hour: "hour of day (local)",
    legend_temp: "Mean air temperature", legend_wind: "Mean wind speed", legend_hot: "Hot hours (>35°C)",
    legend_warm: "Hot night hours (19–07h >26.3°C)",
    cat_all: "All categories", scenario_all: "All scenarios",
    map_single_hint: "The map shows the historical period; click a subzone and the diurnal curves in the chart window show all 7 scenarios together (the annual, heatwave and warm-night charts need a single scenario). Downloads include every scenario.",
    click_download: "Click to view / download this subzone",
    no_selection: "No subzone selected",
    diurnal_title: "Mean diurnal cycle (24h)",
    annual_title: "Annual Ta",
    temp_c: "Temp (°C)", rh: "RH (%)", wind_ms: "Wind (m/s)", ghi: "GHI (W/m²)",
    hot_hours_yr: "Hot hours", hot_night_hours: "Hot night hours", hours: "hours",
    heatwave_title: "Heatwave days", daily_max: "Daily max", daily_mean_t: "Daily mean",
    is_heatwave: "Heatwave day", total_hw: "Total heatwave days", days_unit: "days",
    warmnight_title: "Warm nights", daily_min: "Daily min", is_warmnight: "Warm night", total_wn: "Total warm nights",
    dl_one: "Download", dl_all_sc: "Download all 7 scenarios (zip)", dl_open: "Open download panel",
    am_lt: "Long-term projection", am_st: "Short-term forecast",
    am_lt_tip: "Long-term projection: MSS climate scenarios downscaled to subzones by UT&C, 1995–2099 climate and EPW",
    am_st_tip: "Short-term forecast: Google WeatherNext V3 ensemble (statistics of 64 members) on Singapore's 0.05° / 0.1° grids, hourly, the last 15 days",
    wn_title: "forecast", wn_gridline: "Grid",
    wn_gridline_tip: "On: the WeatherNext grid cells (with their boundaries); off: the 332 subzones, each the area-weighted mean of the grid cells it overlaps (weight = subzone ∩ cell area)",
    wn_zone_note: g=>`332 subzones · area-weighted grid cells · ${g}`,
    wn_aw: (n,p,lat,lon)=>`area-weighted over ${n} grid cell(s) · largest weight ${p}% (${lat}°N ${lon}°E)`,
    wn_grid: "Grid", wn_var: "Variable", wn_stat: "Statistic",
    wn_grid_label: {"0p05":"0.05° (104 points, station-calibrated)", "0p1":"0.1° (36 points, all variables)"},
    cmp_label: "Compare with observed (swipe)", cmp_tip: "Adds a divider you can drag across the map (double-click its ⇆ to swap the sides): forecast on the left, the observed state of the same hour on the right - 2 m temperature / dewpoint / humidity from ERA5-Land (0.1°, land only) or ERA5 (0.25°), switchable; wind, radiation and rain from ERA5, dots = MSS weather-station observations; one colour range for both sides.",
    cmp_fc: "Forecast", cmp_obs: "Observed", cmp_src: {era5land:"ERA5-Land reanalysis (0.1°)", era5:"ERA5 reanalysis (0.25°)"},
    cmp_show_era: "Reanalysis (ERA5 / ERA5-Land)", cmp_show_st: "MSS weather stations", cmp_none: "all hidden",
    cmp_show_era_tip: "Show / hide the reanalysis colours on the right (ERA5-Land or ERA5 for 2 m temperature / dewpoint / humidity, ERA5 for the other variables). When hidden, its values no longer count in the colour range.",
    cmp_show_st_tip: "Show / hide the MSS weather-station dots on the right. When hidden, their values no longer count in the colour range.",
    cmp_era: "Reanalysis", cmp_era_opt: {era5land:"ERA5-Land (0.1°, land only)", era5:"ERA5 (0.25°, incl. sea)"},
    cmp_era_tip: "Two reanalyses for observed 2 m temperature / dewpoint / humidity: ERA5-Land, 0.1°, land only, finer; ERA5, 0.25°, sea included, coarser. Neither is station-calibrated; over the city both usually run cooler than the stations.",
    cmp_noera: "no ERA5", cmp_st: n=>`${n} MSS stations`, cmp_st_one: "MSS station", cmp_st_note: "station observation (hourly)",
    cmp_aw: "area-weighted", cmp_legend: "swipe: left = forecast, right = observed, one colour range",
    cmp_noera_msg: n=>`ERA5 not downloaded yet (needs the CDS API).${n>0 ? ` Dots on the right: ${n} MSS station observations.` : n===0 ? " No station observation for this variable / hour either." : ""}`,
    cmp_noera_hour: n=>`No ERA5 for this hour yet (ERA5 is published about 5 days late).${n>0 ? ` Dots on the right: ${n} MSS station observations.` : n===0 ? " No station observation for this variable / hour either." : ""}`,
    wn_fill: "Fill colours", wn_fill_tip: "Show / remove the fill colours of the grid cells or subzones. Without them only the boundaries and the coastline remain; hover still shows the values.",
    wn_auto: "Colour range per hour", wn_auto_tip: "On: the colour range stretches over this hour's min–max, so spatial differences show (as the reference maps); off: one fixed range for the whole forecast, to compare hours while playing.",
    wn_auto_on: "range: this hour's min–max", wn_auto_off: "range: fixed for the whole forecast",
    wn_var_label: {t2m:"2 m temperature", d2m:"2 m dewpoint", rh:"2 m relative humidity", ws10:"10 m wind speed", u10:"10 m wind u (eastward +)",
      v10:"10 m wind v (northward +)", ws100:"100 m wind speed", u100:"100 m wind u (eastward +)", v100:"100 m wind v (northward +)",
      ssrd:"Surface solar radiation (1 h mean)", dsr:"Surface direct radiation (1 h mean)", tp:"Precipitation (model)", tp_imerg:"Precipitation (IMERG-calibrated)", tp_exp:"Precipitation (experimental)"},
    wn_stat_label: {mean:"Mean", p10:"p10 (10th percentile)", p25:"p25 (25th percentile)", p50:"p50 (median)", p75:"p75 (75th percentile)", p90:"p90 (90th percentile)"},
    wn_rh_note: "Relative humidity has one value only: estimated from the mean temperature and mean dewpoint (Magnus), no percentiles",
    wn_dry_note: "cells below 0.01 mm/h are not coloured",
    wn_st_main_tip: "Shows / hides the hourly MSS weather-station observations as dots: over the forecast without the swipe, on the observed side with it (same colour range, counted in it). Only 2 m temperature / dewpoint / humidity, 10 m wind and precipitation have station data. With the swipe on, the dots are drawn on its observed side.",
    wn_st_none: "no station observation of this variable (the stations measure temperature, humidity, 10 m wind and rain)",
    wn_view_st: "MSS station observations are drawn over the forecast (dots).",
    wn_now_title: "Current data", wn_view_now: s=>`Current view: ${s}.`, cmp_legend_help: f=>f ? "Swipe: left = observed, right = forecast (swapped), one colour range." : "Swipe: left = forecast, right = observed, one colour range.",
    cmp_handle_tip: "Drag: move the divider; double-click: swap forecast and observed sides",
    wn_info: (init,a,b,n)=>`Latest init ${init}. Time axis ${a} – ${b}, ${n} init(s); every hour takes the newest init that covers it (intermediate inits for 0–48 h, the main cycle beyond).`,
    wn_init: (init,kind,lead)=>`Init ${init} · ${kind} · lead +${lead} h`,
    wn_kind: {main:"main cycle", intermediate:"intermediate"},
    wn_time_tip: "Click to type a date and time (SGT, whole hours); Enter to confirm, Esc to cancel. A time outside the axis goes to its nearest end.",
    wn_none: "no data at this hour", wn_past: "past", wn_now_lbl: "now", wn_play: "Play", wn_pause: "Pause", wn_speed_tip: "Playback speed: 1× = 0.45 s per hour, 2× / 4× faster", wn_now_tip: "Jump to the current hour",
    wn_wday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], wn_nodata: "No WeatherNext data found (data/wn3/)",
    dl_all_hint: "Archive of the EPW of all 332 subzones × 7 scenarios",
    help_wn: `<h4>Short-term forecast (WeatherNext V3)</h4>
      <p>Google WeatherNext V3 is an AI ensemble weather forecast: each init runs 64 members (64 possible evolutions of the weather), which Google publishes as 6 statistics — the <b>mean</b> and <b>p10 / p25 / p50 (median) / p75 / p90</b>; the wider p10–p90, the less certain the forecast. Singapore has two grids: <b>0.05°</b> (104 points, calibrated with weather-station observations, temperature, dewpoint and humidity only) and <b>0.1°</b> (36 points, all variables).</p>
      <table class="cat-tbl help-tbl"><thead><tr><th>Variable</th><th>Grid</th><th>Unit</th><th>Meaning</th></tr></thead><tbody>
      <tr><td>2 m temperature</td><td>0.05° / 0.1°</td><td>°C</td><td>air temperature 2 m above ground, instantaneous on the hour; station-calibrated on the 0.05° grid</td></tr>
      <tr><td>2 m dewpoint</td><td>0.05° / 0.1°</td><td>°C</td><td>the temperature at which the air would saturate (dew forms); higher = more humid</td></tr>
      <tr><td>2 m relative humidity</td><td>0.05° / 0.1°</td><td>%</td><td>not a forecast variable: estimated from the mean temperature and mean dewpoint (Magnus), a single value without percentiles</td></tr>
      <tr><td>10 m wind speed, u / v</td><td>0.1°</td><td>m/s</td><td>wind 10 m above ground; u positive eastward, v positive northward. The speed has its own statistics, so its mean is in general not the speed of the mean u, v</td></tr>
      <tr><td>100 m wind speed, u / v</td><td>0.1°</td><td>m/s</td><td>wind 100 m above ground, about the roof height of tall buildings</td></tr>
      <tr><td>Surface solar radiation</td><td>0.1°</td><td>W/m²</td><td>total shortwave radiation reaching the ground (direct + diffuse), mean over the hour</td></tr>
      <tr><td>Surface direct radiation</td><td>0.1°</td><td>W/m²</td><td>its direct-beam part, mean over the hour</td></tr>
      <tr><td>Precipitation (model)</td><td>0.1°</td><td>mm/h</td><td>the model's own precipitation total for the hour</td></tr>
      <tr><td>Precipitation (IMERG-calibrated)</td><td>0.1°</td><td>mm/h</td><td>a version calibrated to the NASA GPM IMERG satellite precipitation</td></tr>
      <tr><td>Precipitation (experimental)</td><td>0.1°</td><td>mm/h</td><td>a precipitation product Google marks as experimental</td></tr>
      </tbody></table>
      <p>All times are Singapore time (SGT = UTC+8). Precipitation and radiation are totals / means over an hour, stamped at its end: 14:00 = 13:00–14:00. Cells with &lt; 0.01 mm/h of precipitation are not coloured.</p>
      <h4>Display and controls</h4>
      <p>Pick the grid, variable and statistic in the left panel. The panel's <b>Grid</b> switch shows the grid cells (with their boundaries) when on; when off, the 332 subzones each show the <b>area-weighted mean</b> of the grid cells they overlap (weight = subzone ∩ cell area, renormalised where a cell is missing; the nearest grid point only if a subzone overlaps no cell). Hover for the value and p10–p90 range (in subzone mode also the number of cells averaged and the largest weight). Tick <b>MSS weather stations</b> to draw the hourly station observations as dots over the forecast (same colour range, counted in it; no station data for 100 m wind and radiation); with the swipe on, the dots are drawn on its observed side.</p>
      <p>The time bar at the bottom moves hour by hour: drag the slider, ‹ 1h / 1h › or the ← → keys; ▶ plays (1× / 2× / 4×); ⟲ returns to now; click the time to type a date and time. Every hour takes the newest init that covers it: the newest intermediate init for 0–48 h, the newest main cycle (00 / 06 / 12 / 18 UTC, 15 days) beyond. The data are downloaded 4 times a day and the inits of the last 15 days are kept, so the axis covers the past 15 and the next 15 days.</p>
      <h4>Compare with observed (swipe)</h4>
      <p>A divider you can drag across the map: forecast on the left, the observed state of the same hour on the right, on one colour range; double-click the ⇆ on the divider to swap the sides. There are three observed data sets: the reanalysis is shown / hidden in the swipe options, the stations by the panel's <b>MSS weather stations</b> switch (a hidden one is left out of the colour range).</p>
      <table class="cat-tbl help-tbl"><thead><tr><th>Data</th><th>Resolution / coverage</th><th>Variables compared</th><th>Notes</th></tr></thead><tbody>
      <tr><td><b>ERA5-Land</b><br>reanalysis</td><td>0.1° (about 9 km), land only;<br>32 cells over Singapore</td><td>2 m temperature, dewpoint, humidity (default)</td><td>ECMWF's land-surface rerun driven by the ERA5 near-surface atmosphere on finer terrain and land cover, with no data assimilation of its own; more spatial detail over land than ERA5, nothing over the sea</td></tr>
      <tr><td><b>ERA5</b><br>reanalysis</td><td>0.25° (about 28 km), sea included;<br>12 cells over Singapore</td><td>10 m / 100 m wind, surface solar and direct radiation, precipitation (all three precipitation forecasts compare with it); 2 m temperature / dewpoint / humidity can be switched to it under <b>Reanalysis</b></td><td>ECMWF's global reanalysis, assimilating many observations (satellites, radiosondes, surface stations); coarse cells often span city and sea, so coastal cells run cooler and more humid</td></tr>
      <tr><td><b>MSS weather stations</b><br>observed</td><td>points (dots), about 89–91 a day;<br>18 measure temperature / humidity,<br>17–18 wind, the rest rain only</td><td>2 m temperature, dewpoint, humidity, 10 m wind, precipitation (no 100 m wind or radiation)</td><td>data.gov.sg open data (NEA / Meteorological Service Singapore). Minute readings to hourly: temperature, humidity and wind speed as the mean within ±30 min of the hour (direction as a vector mean), rain as the total of the hour before, dewpoint from temperature and humidity</td></tr>
      </tbody></table>
      <p>Both reanalyses are published about 5 days late, so recent hours show the stations only. In subzone mode the reanalysis is area-weighted like the forecast; the stations are always dots. Neither reanalysis models the urban heat island or is calibrated with Singapore's stations, so over the city both usually run cooler than the stations: trust the stations for the city, and the reanalyses for the broad pattern and the passage of weather. Downloaded by <code>download_singapore_era5.py</code> (Copernicus CDS) and <code>download_singapore_stations.py</code> into <code>era5/</code> and <code>stations/</code> of the WeatherNext data folder, the last 15 days kept.</p>`,
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    ssp_label: {historical:"Historical", ssp126:"SSP1-2.6", ssp245:"SSP2-4.5", ssp585:"SSP5-8.5"},
    period_label: {"1995-2014":"Historical (1995–2014)","2040-2059":"Mid-century (2040–2059)","2080-2099":"End-century (2080–2099)"},
    cat_fill_on: "Colour subzones by category", cat_fill_off: "Back to the map colours", cat_fill_title: "Subzone category", cat_fill_lab: "Category",
    cat_fill_tip: "Colour by category: fills every subzone on the map with its category colour (the circle in front of it in the list); the legend lists the categories with their counts. Click again to restore the map colours.",
    cat_label: {utc:"UT&C standard", crown_shrunk:"Crown shrunk", tree_shortened:"Tree shortened",
                tree_taller:"Tree taller (passthrough)", no_building:"No building (passthrough)", crown_overshrunk:"Crown over-shrunk"},
    nods_tip: "Without downscaled: source EPW passthrough", nods_badge: "Without downscaled", cl_kind_zone: "Subzone", cl_kind_tip_z: "Hover: highlights this subzone on the map; click: pins / unpins the highlight; double-click: zooms the map to it",
    cat_tab_hint: "Pick a category to outline all its subzones on the map in the colour of its circle; \"All categories\" clears it.",
    nods_sw_on: "Shown", nods_sw_off: "Off", nods_sw_tip: "Non-downscaled subzones: switch off to hide these 58 subzones on the map and in the list (UBEM.sg: their buildings are not coloured); switch on to bring them back.",
    cat_tab_ds: "Downscaled (UT&C)", cat_tab_nods: "Without downscaled (source EPW passthrough)",
    jg_others: "Outline subzones outside it", jg_others_tip: "With Jurong Gateway only, the subzones outside it are hidden; tick to show their boundaries (no colours, no hover or click), untick to hide them again.",
    sel_jurong: n=>`Select all subzones in it (${n})`, sel_jurong_tip: "Adds every subzone of Jurong Gateway (≥5% of its area inside) to the selection: outlined on the map, downloadable together with \"Download selected EPW\" below; subzones already selected stay. With the non-downscaled switch off, those are left out.",
    sel_cat: n=>`Select these (${n})`, sel_cat_tip: "Select these: add every subzone of the current list to the selection (outlined on the map, EPW download together); the category tabs above and the search box set the list.",
    cat_tip_head: "Circle colour = subzone category (rules in About)", cat_grp_ds: n=>`Downscaled (UT&C, ${n})`,
    cat_grp_nods: n=>`Without downscaled (source EPW passthrough, ${n})`, cat_ds: "downscaled (UT&C)", cat_nods: "without downscaled, source EPW passthrough",
    selected_n: (n)=>`${n} selected · Ctrl (⌘ on Mac) + click a subzone on the map to add or remove it`,
    dl_zip_building: "Building zip…", dl_server: (n, m)=>`Download started: the local server is zipping ${n} subzones × ${m} scenarios - a large file, see the browser's download bar.`,
    dl_done: "Download complete",
    help_html: `
      <p>This platform presents <b>MSS → UT&C</b> downscaled climate data for Singapore's 332 subzones, with online visualization and EPW download.</p>
      <h4>MSS V3 downscaled data · map display modes</h4>
      <p>① <b>Monthly T/Wind</b>: pick scenario + year + month + variable; subzones are colored by the selected variable.<br>
         ② <b>Hot hours</b>: pick scenario + year; shows hours >35°C that year.<br>
         ③ <b>Warm nights</b>: pick scenario + year; shows that year's night-time (19:00–07:00) hours above 26.3°C. A warm night is a night whose daily minimum stays above 26.3°C — the temperature never drops below 26.3°C all night.<br>
         The <b>Fill</b> switch (top-right) turns subzone coloring off/on at any time — off leaves basemap and boundaries only.</p>
      <h4>MSS V3 raw data (before downscaling)</h4><p>With the <b>MSS V3 raw data</b> panel on, the map shows the data before downscaling (instead of the downscaled-data colouring): the <b>2 km grid</b> is the MSS V3 SINGV-RCM output itself (NorESM2-MM driven, 24 x 36 points; hourly data summarised as monthly mean temperature, humidity, wind speed, solar radiation, monthly rainfall, and yearly hot hours and hot night hours), for the selected year or the <b>20-year mean</b>; <b>Subzones (forcing EPW)</b> shows the forcing EPW each subzone was given before downscaling (Forcing_epw) - the 20-year average year of the 2 km <b>land</b> point nearest to its centroid (land points only since 2026-10-05; 12 coastal / island subzones had sea points before), hence no year dependence. Both come from the same data: the 20-year mean grid at a point equals the forcing EPW of the subzones using it (temperature within 0.05 °C, the EPW's one-decimal rounding, which also moves hot / hot-night hour counts slightly near the thresholds). Hover a grid point for its coordinates, land or sea and the subzones given it; hover a subzone for its grid point and the distance to its centroid. Each view can show / hide the other's outlines: <b>Subzone outlines</b> in the grid view, <b>2 km grid outlines</b> in the subzone view (thin white lines = grid cells, dark frames = land points, dashed orange frames = the points in use). With <b>Colour range per month</b> ticked, the colour range stretches over the min–max of the map now shown (changing with scenario, year and month), so spatial differences show; unticked, each variable keeps one fixed range (p2–p98 of the land points over all scenarios, years and months), so colours compare across months, years and scenarios.</p>
      <h4>Year &amp; extent</h4>
      <p>Year slider 1995–2099; only 1995–2014 / 2040–2059 / 2080–2099 have data — other years show as transparent (no data). Toggle "Jurong Gateway only" to focus on that area; The area means the 21 subzones with ≥5% of their area inside Jurong Gateway (1 of them not downscaled); once ticked, <b>Outline subzones outside it</b> shows the other subzones' boundaries (no colours). <b>Select all subzones in it</b> below adds these 21 to the selection at once (20 with the non-downscaled switch off), for a joint EPW download.</p>
      <h4>Subzone categories (list circle colours)</h4>
      <p>The circle in front of each subzone in "Subzone selection &amp; download" shows its category, assigned by <code>pipeline/bypass_filter.py</code> from the raster mean building height bh, mean tree height th and the crown geometry, in this order (the first rule that applies wins). Hover 1.5 s over a circle, the panel title or a category tab for an explanation; a tab filters the list by category and outlines its subzones on the map in the same colour.</p>
      <table class="cat-tbl"><thead><tr><th></th><th>Category</th><th>Rule</th><th>Downscaled</th><th>Subzones</th></tr></thead><tbody><tr><td><i style="background:#9ca3af"></i></td><td>No building (passthrough)</td><td>no building pixels in the land-cover raster (bh = 0); UT&C needs a non-empty building mask</td><td class="no">No</td><td class="n">15</td></tr><tr><td><i style="background:#eab308"></i></td><td>Tree taller (passthrough)</td><td>th ≥ 1.2 × bh: the canopy dominates the canyon, UT&C's two-trees-in-a-canyon abstraction no longer holds</td><td class="no">No</td><td class="n">36</td></tr><tr><td><i style="background:#a855f7"></i></td><td>Crown over-shrunk (passthrough)</td><td>to keep the crown bottom ≥ 0.3 m above ground the crown radius had to shrink to under 1/5 (r_raw / r_final > 5): degenerate canyon (far too wide)</td><td class="no">No</td><td class="n">7</td></tr><tr><td><i style="background:#e64a19"></i></td><td>Tree shortened</td><td>bh < th < 1.2 × bh: crown top clamped to max(1 % × bh, 0.3 m) below the building height, then UT&C</td><td class="yes">Yes</td><td class="n">19</td></tr><tr><td><i style="background:#22c55e"></i></td><td>Crown shrunk</td><td>crown radius reduced (at most 5×) to keep the crown bottom ≥ 0.3 m above ground; UT&C runs normally</td><td class="yes">Yes</td><td class="n">22</td></tr><tr><td><i style="background:#3b82f6"></i></td><td>UT&C standard</td><td>all other subzones: UT&C on the raster morphology as is</td><td class="yes">Yes</td><td class="n">233</td></tr></tbody></table>
      <p>274 downscaled, 58 not; for the non-downscaled ones <code>outputs/downscaled_epw</code> holds a copy of the source forcing EPW (passthrough). On the map their hover / selection outline is <b style="color:#d946ef">magenta</b> (downscaled subzones: teal hover, orange selection).</p>
      <h4>Interaction</h4>
      <p>Hover for values; <b>single-click</b> a subzone to select just it and show it in the curves window (hourly curves &amp; Annual Ta); <b>double-click</b> to open its download panel and morphology/downscaling figures. Use the left list + scenario to batch-download EPW (any number of subzones); <b>Ctrl</b> (⌘ on Mac) <b>+ click</b> a subzone on the map to add it to or remove it from the selection; with a single scenario chosen under Scenario, the curves window overlays the selected subzones (at most 6: on the map a 7th Ctrl + click deselects the earliest selected; with more selected in the list or with the buttons there is no comparison - the most recently selected subzone is shown and all selected keep the orange outline), with a table of their hot hours, hot night hours, heatwave days and warm nights at the top; the compared subzones are outlined on the map in their curve colours. The window always shows the subzones selected on the map: on the map a plain click selects just one, in the list a click adds or removes any number, Clear deselects all. In the curves window, Annual Ta marks the 35°C and 26.3°C lines with their hour counts, followed by Heatwave days and Warm nights. All three run on a full-year time axis: zoom with the mouse wheel or the slider below, and the axis labels go from months to days to hours.</p>
      <h4>Top-bar tools</h4>
      <p>The <b>Long-term projection / Short-term forecast</b> tabs at the top switch between the two data sets; this page covers the long-term projection only; the short-term forecast has its own notes: switch to that tab and open <b>About</b> again. <b>Compare scenarios</b> (in the Scenario panel): 2–4 panels side by side comparing different years/scenarios. <b>Download all EPW</b> (bottom of the left panel): one-click archive of all 332×7 EPW. Toggle 中/EN at top-right. The hourly-curves window opens when you click a subzone (× to close). The <b>computation workflow</b> diagram is at the end of this About (click to enlarge).</p>
      <h4>Data sources</h4>
      <p>Island-wide values are read <b>per selected year</b> from MSS <code>CSV_yearly</code> (mode 1 = that year's monthly means, mode 2 = that year's hours >35°C, mode 3 = that year's night-time hours >26.3°C; all pre-downscaling; since 2026-10-05 coastal subzones use the nearest land grid point). The MSS V3 raw data panel's 2 km grid comes from the hourly MSS V3 SINGV-RCM output (<code>MSS/out/_cache</code>) and its subzone values from the pre-downscaling forcing EPW (<code>Forcing_epw</code>), summarised by <code>web/prepare_mss_raw.py</code>. The EPW downloads are the UT&C downscaling products in <code>downscaled_epw</code> (copies of the forcing EPW for subzones not downscaled); in a subzone's window the morphology figures are static images from <code>outputs/figures</code> and the downscaling chart is drawn live from <code>downscaled_epw/_npz_16</code> (UT&C hourly street-canyon microclimate, 16 variables). Hourly curves (incl. heatwave and warm-night stats) are parsed live from the selected downscaled EPW. In the Workshop package these data are in <code>Source data\\1_MSS_V3_长期预测</code> (<code>forcing_epw</code>, <code>downscaled_epw</code>). For the short-term forecast's data sources see its own About.</p>`,
  }
};

let LANG = "zh";
function t(key){ return I18N[LANG][key]; }
function setLang(lang){
  LANG = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const v = I18N[lang][el.getAttribute("data-i18n")];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-tip]").forEach(el=>{          // 1.5 s hover tip of static controls
    const v = I18N[lang][el.getAttribute("data-i18n-tip")];
    if (typeof v === "string") el.setAttribute("data-tip", v);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
    const v = I18N[lang][el.getAttribute("data-i18n-ph")];
    if (typeof v === "string") el.placeholder = v;
  });
  document.querySelectorAll("#lang-toggle button").forEach(b=>
    b.classList.toggle("active", b.dataset.lang===lang));
  if (window.onLangChange) window.onLangChange(lang);
}
