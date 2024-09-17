/**
 
 * Modifications Log
 * Ver   Date         Author      Modification
 * 1.0   09-16-2024   Marc Swan   Initial Version
**/
import { LightningElement, track, api } from 'lwc';
import getCountries from '@salesforce/apex/CountryMetadataController.getCountries';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class DualListboxWithIcons extends LightningElement {
    @api instanceId; // Unique identifier for each instance
    @api cardTitle = 'Languages';

    // Declare the backing field for selectedCountriesInput
    @track _selectedCountriesInput = '';

    @api 
    get selectedCountriesInput() {
        return this._selectedCountriesInput;
    }
    set selectedCountriesInput(value) {
        this._selectedCountriesInput = value;
        console.log(`Instance ${this.instanceId} selectedCountriesInput set:`, value);
        this.inputSet = true; // Flag indicating input has been set

        if (this.availableOptions.length > 0) {
            this.initializeSelectedList(value ? value.split(';') : []);
        }
    }
    @api selectedCountriesOutput;

    @track availableOptions = [];
    @track selectedOptions = [];
    @track filteredAvailableOptions = [];
    @track highlightedOptions = new Set(); // Store highlighted items

    // Flags to manage initialization
    inputSet = false;
    dataFetched = false;
    hasRendered = false; // To prevent multiple executions in renderedCallback

    // Computed getter for dynamic name attribute
    get dualListboxName() {
        return `dualListbox-${this.instanceId}`;
    }

    // Computed getter for dynamic data-id attribute
    get dualListboxDataId() {
        return `dualListbox-${this.instanceId}`;
    }

    // Computed getter for searchClearDataId
    get searchClearDataId() {
        return `${this.dualListboxDataId}-searchClear`;
    }

    connectedCallback() {
        this.fetchCountries();
        console.log(`Instance ${this.instanceId} connectedCallback`);
        console.log(`Instance ${this.instanceId} searchClearDataId:`, this.searchClearDataId);
        console.log(`Instance ${this.instanceId} dualListboxDataId:`, this.dualListboxDataId);
        console.log(`Instance ${this.instanceId} dualListboxName:`, this.dualListboxName);
        console.log(`Instance ${this.instanceId} selectedCountriesInput:`, this.selectedCountriesInput);
    }

    renderedCallback() {
        // Prevent executing multiple times for the same render
        if (this.hasRendered) {
            return;
        }
        this.hasRendered = true;

        // Ensure that the element exists before attempting to access it
        const searchInput = this.template.querySelector(`[data-element-id="${this.searchClearDataId}"]`);

        if (searchInput) {
            // Apply a CSS class for styling instead of manipulating shadowRoot
            searchInput.classList.add('custom-search-input');
        } else {
            console.warn(`Instance ${this.instanceId}: Element with data-element-id="${this.searchClearDataId}" not found.`);
        }
    }

    fetchCountries() {
        getCountries()
            .then(data => {
                this.availableOptions = data.map(country => ({
                    value: country.value,
                    label: country.label,
                    icon: country.avatar,
                    isSelected: false
                }));
                this.dataFetched = true;
                console.log(`Instance ${this.instanceId} fetched availableOptions:`, this.availableOptions);

                if (this.inputSet) {
                    this.initializeSelectedList(this._selectedCountriesInput ? this._selectedCountriesInput.split(';') : []);
                } else {
                    this.filteredAvailableOptions = [...this.availableOptions];
                }
            })
            .catch(error => {
                console.error(`Instance ${this.instanceId} error fetching countries:`, error);
            });
    }

    initializeSelectedList(selectedCountries) {
        console.log(`Instance ${this.instanceId} initializing selected list with:`, selectedCountries);
        this.selectedOptions = selectedCountries.map(countryCode => {
            const countryOption = this.availableOptions.find(option => option.value === countryCode);
            if (countryOption) {
                this.availableOptions = this.availableOptions.filter(opt => opt.value !== countryCode);
                return { ...countryOption, isSelected: true };
            }
            return null;
        }).filter(option => option !== null);

        this.filteredAvailableOptions = [...this.availableOptions];
        this.sortAvailableOptions();
        this.updateOptionClasses();
        this.updateSelectedCountriesOutput();
    }

    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
        this.filteredAvailableOptions = this.availableOptions.filter(option =>
            option.label.toLowerCase().includes(searchKey)
        );
    }

    handleHighlight(event) {
        const optionId = event.currentTarget.dataset.id;
        if (this.highlightedOptions.has(optionId)) {
            this.highlightedOptions.delete(optionId);
        } else {
            this.highlightedOptions.add(optionId);
        }
        this.updateOptionClasses();
    }

    handleAdd() {
        this.highlightedOptions.forEach(optionId => {
            const option = this.availableOptions.find(opt => opt.value === optionId);
            if (option) {
                this.selectedOptions = [...this.selectedOptions, { ...option, isSelected: true }];
                this.availableOptions = this.availableOptions.filter(opt => opt.value !== optionId);
            }
        });
        this.sortAvailableOptions();
        this.filteredAvailableOptions = [...this.availableOptions];
        this.highlightedOptions.clear();
        this.updateOptionClasses();
        this.updateSelectedCountriesOutput();
    }

    handleRemove() {
        this.highlightedOptions.forEach(optionId => {
            const option = this.selectedOptions.find(opt => opt.value === optionId);
            if (option) {
                this.availableOptions = [...this.availableOptions, { ...option, isSelected: false }];
                this.selectedOptions = this.selectedOptions.filter(opt => opt.value !== optionId);
            }
        });
        this.sortAvailableOptions();
        this.filteredAvailableOptions = [...this.availableOptions];
        this.highlightedOptions.clear();
        this.updateOptionClasses();
        this.updateSelectedCountriesOutput();
    }

    sortAvailableOptions() {
        this.availableOptions.sort((a, b) => a.label.localeCompare(b.label));
    }

    updateOptionClasses() {
        this.filteredAvailableOptions = this.filteredAvailableOptions.map(option => ({
            ...option,
            class: this.computeOptionClass(option.value),
            isSelected: this.highlightedOptions.has(option.value) ? 'true' : 'false'
        }));
        this.selectedOptions = this.selectedOptions.map(option => ({
            ...option,
            class: this.computeOptionClass(option.value),
            isSelected: this.highlightedOptions.has(option.value) ? 'true' : 'false'
        }));
    }

    computeOptionClass(optionId) {
        let baseClass = 'slds-listbox__item slds-listbox__option_plain slds-media slds-media_small slds-media_inline'; 
        if (this.highlightedOptions.has(optionId)) {
            baseClass += ' slds-is-selected';
        }
        return baseClass;
    }

    updateSelectedCountriesOutput() {
        this.selectedCountriesOutput = this.selectedOptions.map(option => option.value).join(';');
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedCountriesOutput', this.selectedCountriesOutput));
        console.log(`Instance ${this.instanceId} Selected Countries Output:`, this.selectedCountriesOutput);
    }

    handleClearSearch() {
        const searchInputEl = this.template.querySelector(`[data-element-id="${this.searchClearDataId}"]`);
        if (searchInputEl) {
            searchInputEl.value = ''; // Clear the input value
            this.filteredAvailableOptions = [...this.availableOptions]; // Reset the filtered options
        } else {
            console.warn(`Instance ${this.instanceId}: Element with data-element-id="${this.searchClearDataId}" not found.`);
        }
    }
}