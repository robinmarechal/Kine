import JQueryObject from "../libs/JQueryObject";
import Editor from "./Editor";
import {config_pikaday} from "../data/pikaday.data";
import {INPUT_TYPES, modelsFormData} from "../data/models_formData";


/**
 * Form Generator
 */
export default class FormGenerator {

    /**
     * @param namespace ../api/{namespace}
     * @param data the object to update, of null/empty if creation
     */
    constructor(namespace, data = null) {
        this.namespace = namespace;
        this.inputs = [];
        this.onValidate = null;
        this.onCancel = null;
        this.method = data && data.id ? 'PUT' : 'POST';
        this.texteareaSelector = null;
        this.datepickerSelector = null;
        this.datepicker = null;
        this.data = data;
        this.formTag = null;
    }

    /**
     * Create an instance of FormGenerator
     * @param namespace ../api/{namespace}
     * @param data the object to update, of null/empty if creation
     * @returns {FormGenerator}
     */
    static create(namespace, data = null) {
        return new FormGenerator(namespace, data);
    }

    _generateRandomClassName() {
        const rand1 = Math.round(Math.random() * 999999);
        const rand2 = Math.round(Math.random() * 999999);
        const rand3 = Math.round(Math.random() * 999999);
        return 'fg_' + rand1 + rand2 + rand3;
    }


    /**
     * Create a bootstrap's .form-group div
     * @param input the group's input
     * @param label the group's label, or empty/null
     * @returns {jQuery} jQuery element
     */
    createFormGroup(input, label = null) {
        const formGroup = new JQueryObject('div');
        formGroup.addClass('form-group');

        if (label) {
            formGroup.append(label);
        }

        formGroup.append(input);

        return formGroup.build();
    }

    /**
     * Create a bootstrap label tag
     * @param text the text of the label
     * @returns {jQuery} the label element
     */
    createLabel(text) {
        const label = $('<label></label>');
        label.append(text);
        label.addClass('label-control');

        return label;
    }

    /**
     * Create a bootstrap input
     * @param name the value of the name attribute
     * @param data the information of the data. => modelsFormData[namespace][name]
     * @returns {jQuery} jquery element
     */
    createInput(name, data) {
        const attributes = data.attributes;
        const tag = data.tag;
        let input;

        if (tag == INPUT_TYPES.INPUT) {
            input = $('<input />');
        }
        else if (tag == INPUT_TYPES.TEXTAREA) {
            input = $('<textarea></textarea>');
            const className = this._generateRandomClassName();
            this.texteareaSelector = '.' + className;
            input.addClass(className);
        }
        else if (tag == INPUT_TYPES.DATE) {
            input = $('<input/>');
            input.attr('type', 'text');
            input.attr('placeholder', 'yyyy-mm-dd');
            const className = this._generateRandomClassName();
            this.datepickerSelector = '.' + className;
            input.addClass(className);
        }
        else if (tag == INPUT_TYPES.TIME) {
            input = $('<input/>');
            input.attr('placeholder', 'HH:mm');
            input.attr('type', 'text');
        }
        else if (tag == INPUT_TYPES.DATETIME) {
            input = $('<input/>');
            input.attr('placeholder', 'yyyy-mm-dd HH:mm');
            input.attr('type', 'text');
        }

        input.attr('name', name);
        input.addClass('form-control');
        input.addClass('fg-input');

        if (this.data) {
            if (tag == INPUT_TYPES.TEXTAREA) {
                input.html(this.data[name]);
            } else {
                input.attr('value', this.data[name]);
            }
        }

        if (attributes) {
            for (const attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    input.attr(attribute, attributes[attribute]);
                }
            }
        }

        this.inputs.push(input);

        return input;
    }

    /**
     * Generates the form tag with its body
     * @returns {jQuery} the form jQuery element
     */
    generateFormBody() {
        const fields = modelsFormData[this.namespace];
        const fieldNames = fields.fields;
        const formTag = new JQueryObject('form');
        formTag.attr('method', this.method);
        formTag.attr('data-namespace', this.namespace);
        if (this.data && this.data.id) {
            formTag.attr('data-resource-id', this.data.id);
        }

        for (let i = 0; i < fieldNames.length; i++) {
            const fieldName = fieldNames[i];
            const field = fields[fieldName];
            const label = this.createLabel(field.label);
            const input = this.createInput(fieldName, field.input);
            const formGroup = this.createFormGroup(input, label);

            formTag.append(formGroup);
        }

        const built = formTag.build();

        built.on('submit', function (ev) {
            ev.preventDefault();
        });

        return built;
    }

    /**
     * Generate the form and display it in a bootbox dialog.
     * Don't forget to specify the onValidate and onCancel callbacks
     */
    displayInDialog() {
        const formBody = this.generateFormBody();
        this.formTag = formBody;

        bootbox.dialog({
            message: formBody,
            title: 'Modifier un article',
            backdrop: true,
            onEscape: true,
            buttons: {
                cancel: {
                    label: "Annuler",
                    className: "btn-default",
                    callback: () => {
                        if (this.onCancel) {
                            this.onCancel();
                        }
                    }
                },
                validate: {
                    label: "Valider",
                    className: "btn-primary",
                    callback: () => {
                        if (this.onValidate) {
                            this.onValidate(this);
                        }
                    }
                }
            }
        });

        if (this.texteareaSelector) {
            Editor.createUnique(this.texteareaSelector);
        }

        if (this.datepickerSelector) {
            const config = config_pikaday;
            config.field = $(this.datepickerSelector)[0];
            this.datepicker = new Pikaday(config);
        }
    }

    /**
     * Build a JS object containing the values of the form's inputs
     * @returns {{}}
     */
    buildObject() {
        const fields = modelsFormData[this.namespace];
        const obj = {};

        for (let i = 0; i < this.inputs.length; i++) {
            const input = this.inputs[i];
            const name = this.inputs[i].attr('name');
            const attribute = fields[name];
            const inputTag = attribute.input.tag;
            let value;

            if (inputTag == INPUT_TYPES.TEXTAREA) {
                value = Editor.getActiveEditorContent();
            }
            else {
                value = input.val();
            }

            obj[input.attr('name')] = value;
        }

        const id = this.formTag.data('resource-id');
        if (id) {
            obj.id = id;
        }

        return obj;
    }
}