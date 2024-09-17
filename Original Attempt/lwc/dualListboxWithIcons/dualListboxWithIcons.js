/**
 * @description       : 
 * @author            : Marc Swan
 * @group             : 
 * @last modified on  : 09-10-2024
 * @last modified by  : Marc Swan 
 * Modifications Log
 * Ver   Date         Author      Modification
 * 1.0   09-10-2024   Marc Swan   Initial Version
**/
import { LightningElement, track, api, wire } from 'lwc';
import getCountries from '@salesforce/apex/CountryMetadataController.getCountries';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class DualListboxWithIcons extends LightningElement {
    @api cardTitle = 'Languages';
    @api selectedCountriesInput;
    @api selectedCountriesOutput;

    @track availableOptions = [];
    @track selectedOptions = [];
    @track filteredAvailableOptions = [];
    @track highlightedOptions = new Set(); // Store highlighted items

    connectedCallback() {
        // Fetch countries first to ensure options are available before initializing
        this.fetchCountries();
    }

    renderedCallback() {
        // Adjust the margin of the clear icon by data-element-id
        const searchInput = this.template.querySelector('[data-element-id="searchClear"]');

        if (searchInput) {
            const clearIcon = searchInput.shadowRoot.querySelector('.slds-input__icon.slds-input__icon_right');

            if (clearIcon) {
                clearIcon.style.marginTop = '-2rem'; // Adjust the margin as needed
            }
        }
    }

    fetchCountries() {
        // Use wired method to get data
        getCountries()
            .then(data => {
                this.availableOptions = data.map(country => ({
                    value: country.value,
                    label: country.label,
                    icon: country.avatar,
                    isSelected: false // Initialize with isSelected as false
                }));

                // Initialize selected options only after fetching countries
                const storedSelectedCountries = sessionStorage.getItem('selectedCountries');
                if (storedSelectedCountries) {
                    this.initializeSelectedList(storedSelectedCountries.split(';'));
                } else if (this.selectedCountriesInput) {
                    this.initializeSelectedList(this.selectedCountriesInput.split(';'));
                } else {
                    this.filteredAvailableOptions = [...this.availableOptions];
                }
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
            });
    }

    initializeSelectedList(selectedCountries) {
        // Move selected countries to the selected options list and remove from available options
        this.selectedOptions = selectedCountries.map(countryCode => {
            const countryOption = this.availableOptions.find(option => option.value === countryCode);
            if (countryOption) {
                this.availableOptions = this.availableOptions.filter(opt => opt.value !== countryCode);
                return { ...countryOption, isSelected: true };
            }
        }).filter(Boolean);

        // Update the filtered available options and output properties
        this.filteredAvailableOptions = [...this.availableOptions];
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
        const isAlreadyHighlighted = this.highlightedOptions.has(optionId);

        if (isAlreadyHighlighted) {
            this.highlightedOptions.delete(optionId);
        } else {
            this.highlightedOptions.add(optionId);
        }

        // Update options for highlighting
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
        this.filteredAvailableOptions = this.availableOptions;
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
        this.sortAvailableOptions(); // Sort the options after re-adding
        this.filteredAvailableOptions = this.availableOptions;
        this.highlightedOptions.clear();
        this.updateOptionClasses();
        this.updateSelectedCountriesOutput();
    }

    sortAvailableOptions() {
        // Sort the available options alphabetically by label
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
        // Set the output property
        this.selectedCountriesOutput = this.selectedOptions.map(option => option.value).join(';');
        sessionStorage.setItem('selectedCountries', this.selectedCountriesOutput); // Save to session storage
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedCountriesOutput', this.selectedCountriesOutput));
        console.log('Selected Countries Output:', this.selectedCountriesOutput);
    }

    handleClearSearch() {
        this.template.querySelector('lightning-input[type="search"]').value = ''; // Clear the input value
        this.filteredAvailableOptions = [...this.availableOptions]; // Reset the filtered options
    }
}