/**
 * Component manager — initializes all DOM UI components.
 *
 * Add your project-specific components here:
 *   import MenuComponent from '@ui/menu/MenuComponent';
 *   this.instances.menu = new MenuComponent();
 */
export default class Components {
	constructor() {
		this.instances = {};
		this.initComponents();
	}

	initComponents() {
		// Add project-specific components here
	}

	get(name) {
		return this.instances[name];
	}
}
