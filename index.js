const {Plugin} = require("powercord/entities")
const webpack = require("powercord/webpack")
const {getModule, React} = webpack
const util = require("powercord/util")
const {getOwnerInstance, waitFor, forceElementUpdate} = util
const {inject, uninject} = require("powercord/injector")
const {Button} = require("powercord/components")

function addToClassName(existing, addition) {
	if (!existing) existing = ""
	if (existing) existing += " "
	return existing + addition
}

module.exports = class RemoveRolePermissions extends Plugin {
	constructor() {
		super()
	}

	startPlugin() {
		this.cancelled = false
		this.runInjects()
	}

	async runInjects() {
		const content = (await getModule(["content", "sidebarScrollable"])).content.split(" ")[0]
		const checkboxEnabled = (await getModule(["checkboxEnabled"])).checkboxEnabled.split(" ")[0]
		const element = await waitFor("."+content)
		const roleList = element.children[0]
		const instance = getOwnerInstance(roleList)
		if (this.cancelled) return
		inject("rrp-role-list", instance.constructor.prototype, "render", function(_, res) {
			console.log(this)
			console.log(res)
			res.props.children.forEach(c => {
				if (c && c.props && c.props.permissions) c.props.className = addToClassName(c.props.className, "rrp-permission-category")
			})
			const generalIndex = res.props.children.findIndex(c => c && c.props && c.props.spec && c.props.spec.title === "General Permissions")
			if (generalIndex !== -1) {
				const dividerClass = res.props.children.find(c => c && c.props && typeof c.props.className === "string" && c.props.className.includes("40")).props.className
				res.props.children.splice(generalIndex, 0,
					React.createElement(Button, {
						children: "Remove all permissions",
						onClick: () => {
							[...document.querySelectorAll(`.${content} .rrp-permission-category .${checkboxEnabled}`)].filter(c => c.checked).forEach(c => c.click())
						}
					}),
					React.createElement("div", {className: dividerClass})
				)

			}
			return res
		})
		instance.forceUpdate()
	}

	pluginWillUnload() {
		this.cancelled = true
		uninject("rrp-role-list")
	}
}
