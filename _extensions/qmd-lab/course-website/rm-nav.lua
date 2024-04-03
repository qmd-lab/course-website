
-- This is a fragile implementation that parses the sidebar html
-- that exists in meta.include-before. To be run at: post-ast.
function rm_nav(meta)
    if quarto.doc.is_format("html") and
        meta["include-before"] and 
        type(meta["include-before"]) == "table" and 
        #meta["include-before"] >= 1 and 
        meta["include-before"][1] and 
        #meta["include-before"][1] >= 1 and 
        meta["include-before"][1][1] and 
        meta["include-before"][1][1].text then

        local sidebarhtml = meta["include-before"][1][1].text
        quarto.log.output(">>>", sidebarhtml)
        local pattern = '<span class=\"menu%-text\">#nav%-.-</span>'
        meta["include-before"][1][1].text = sidebarhtml:gsub(pattern, "")
        return meta
    end
end

return {
    Meta = rm_nav
}