with open("webapp/src/components/CompetitionChart.jsx", "r") as f:
    lines = f.readlines()

new_lines = []
in_map = False
for line in lines:
    if "{chartData.map((entry, index) => {" in line:
        in_map = True
        new_lines.append(line)
        new_lines.append('                     const fill = entry.isExpandedCenter ? "#ffffff" : (entry.isCluster ? (entry.color || "#8884d8") : (entry.avgViews > (selectedTargetStats?.avgViews || 0) ? "#2ca02c" : "#d62728"));\n')
        new_lines.append('                     const stroke = entry.isExpandedCenter ? "#000000" : "none";\n')
        new_lines.append('                     return <Cell key={`cell-${index}`} fill={fill} stroke={stroke} strokeWidth={entry.isExpandedCenter ? 1 : 0} style={{ cursor: entry.isCluster ? "default" : "pointer" }} />;\n')
        continue

    if in_map:
        if "return <Cell" in line:
            in_map = False
        continue

    new_lines.append(line)

with open("webapp/src/components/CompetitionChart.jsx", "w") as f:
    f.writelines(new_lines)
