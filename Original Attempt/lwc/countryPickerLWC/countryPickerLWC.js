/* /**
 * @description       : 
 * @author            : Marc Swan
 * @group             : 
 * @last modified on  : 09-10-2024
 * @last modified by  : Marc Swan
 * Modifications Log
 * Ver   Date         Author      Modification
 * 1.0   09-10-2024   Marc Swan   Initial Version
**/

/*
import { LightningElement, track, api, wire } from 'lwc';
import getCountries from '@salesforce/apex/CountryMetadataController.getCountries';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

export default class CountryPickerLWC extends LightningElement {
    @api cardTitle = 'Country';
    @api selectedCountries = [];
    @api selectedList = [];
    @api flowInput = [];
    @api flowOutput = [];

    @track sourceList = [];
    @track _rendered = false; // State flag to prevent infinite loop
    dataReady = false;

    connectedCallback() {
        // Process the initial selectedList prop only if selectedCountries is empty
        if (Array.isArray(this.flowInput) && this.flowInput.length > 0 && this.selectedCountries.length === 0) {
            this.selectedCountries = this.flowInput.join(';');
            this.dispatchEvent(new FlowAttributeChangeEvent('selectedCountries', this.selectedCountries));
            this.dispatchEvent(new FlowAttributeChangeEvent('flowOutput', this.flowOutput));
            console.log('Connected Callback - Processed Pre-Selected Countries:', this.selectedCountries);
            console.log('Connected Callback - Processed Pre-Selected flowOutput:', JSON.stringify(this.flowOutput));
        }
    }

    renderedCallback() {
        console.log('Rendered Callback - Called');

        // Ensure selectedList is an array and process only if selectedCountries is empty
        if (Array.isArray(this.flowInput) && this.flowInput.length > 0 && !this._rendered) {
            console.log('Rendered Callback - Processed flowInput:', JSON.stringify(this.flowInput));
            this.selectedCountries = this.flowInput.join(';'); // Create a copy of the array
            this.flowOutput = this.flowInput.join(';'); // Create a copy of the array
            this.selectedList = [...this.flowInput]; // Update selectedList
            this.dispatchEvent(new FlowAttributeChangeEvent('selectedCountries', this.selectedCountries));
            console.log('Rendered Callback - Processed Pre-Selected Countries:', this.selectedCountries);
            
            // Force re-render by creating a new array reference
            this.selectedList = [...this.selectedList];
            console.log('Selected List after Rendered Callback: ', JSON.stringify(this.selectedList));
            this._rendered = true; // Set the flag to prevent infinite loop
        }

        // Trigger handleSelectionChange if data is ready
        if (this.dataReady) {
            this.handleSelectionChange({ detail: { value: this.selectedList } });
            this.dataReady = false; // Reset the flag
        }
    }

    @wire(getCountries)
    wiredCountries({ error, data }) {
        if (data) {
            this.sourceList = data.map(country => {
                return {
                    value: country.value,
                    label: country.label,
                    avatar: {
                        src: country.avatar
                    },
                    //groupName: country.group
                };
            });

            if (Array.isArray(this.flowInput) && this.flowInput.length > 0) {
                this.selectedList = [...this.flowInput];
            }

            console.log('Source list:', JSON.stringify(this.sourceList));
            this.dataReady = true; // Set the flag to indicate data is ready
        } else if (error) {
            console.error('Error fetching countries:', error);
        }
    }

    handleSearch(event) {
        const searchKey = event.detail.value.toLowerCase();
        this.sourceList = this.sourceList.filter(country =>
            country.label.toLowerCase().includes(searchKey)
        );
    }

    handleSelectionChange(event) {
        this.selectedList = event.detail.value;
        this.selectedCountries = this.selectedList.join(';');
        this.flowOutput = this.selectedList.join(';');
        this.dispatchEvent(new FlowAttributeChangeEvent('selectedCountries', this.selectedCountries));
        this.dispatchEvent(new FlowAttributeChangeEvent('flowOutput', this.flowOutput));
        console.log('Selected Countries:', this.selectedCountries);
        console.log('flowOutput - Selected Countries:', this.flowOutput);
    }
} */
    import { LightningElement, api, wire } from 'lwc';
    import getCountries from '@salesforce/apex/CountryMetadataController.getCountries';
    import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
    
    export default class CountryPickerLWC extends LightningElement {
        @api cardTitle = 'Country';
        @api selectedCountries = ''; // Semi-colon separated list of selected countries
        @api flowInput = []; // Input from flow
        @api flowOutput = ''; // Output back to flow
    
        _selectedList = []; // Private variable to store selected countries
        sourceList = []; // List of all countries
        _initialized = false; // State flag to track initialization
        dataReady = false; // Flag to indicate data is ready
    
        @api
        get selectedList() {
            return this._selectedList;
        }
        set selectedList(value) {
            this._selectedList = Array.isArray(value) ? value : [];
            this.updateSelectedCountries(); // Whenever selectedList changes, update selectedCountries
        }
    
        connectedCallback() {
            // Initialize selected countries from flow input if available
            if (Array.isArray(this.flowInput) && this.flowInput.length > 0) {
                this.initializeSelectedList();
            }
        }
    
        renderedCallback() {
            // Only process if not yet initialized
            if (!this._initialized && Array.isArray(this.flowInput) && this.flowInput.length > 0) {
                console.log('Rendered Callback - Processing initialization...');
                this.initializeSelectedList();
                this._initialized = true; // Mark as initialized
            }
    
            // Handle data ready state
            if (this.dataReady) {
                this.handleSelectionChange({ detail: { value: this.selectedList } });
                this.dataReady = false; // Reset the flag
            }
        }
    
        @wire(getCountries)
        wiredCountries({ error, data }) {
            if (data) {
                this.sourceList = data.map(country => ({
                    value: country.value,
                    label: country.label,
                    avatar: { src: country.avatar },
                }));
    
                console.log('Source list:', JSON.stringify(this.sourceList));
                this.dataReady = true; // Set flag for data readiness
            } else if (error) {
                console.error('Error fetching countries:', error);
            }
        }
    
        initializeSelectedList() {
            // Populate selectedList based on flow input
            const newSelectedList = [];
            this.flowInput.forEach(country => {
                if (!newSelectedList.includes(country)) {
                    newSelectedList.push(country); // Add each item from flow input
                }
            });
    
            // Assign the new list to trigger reactivity
            this.selectedList = newSelectedList;
    
            console.log('Initialized selected list:', JSON.stringify(this.selectedList));
        }
    
        updateSelectedCountries() {
            // Update selectedCountries and flowOutput based on the current selectedList
            this.selectedCountries = this.selectedList.join(';');
            this.flowOutput = this.selectedCountries;
    
            // Dispatch events to notify the flow of changes
            this.dispatchFlowAttributeChange('selectedCountries', this.selectedCountries);
            this.dispatchFlowAttributeChange('flowOutput', this.flowOutput);
    
            console.log('Updated selected countries:', this.selectedCountries);
        }
    
        handleSearch(event) {
            const searchKey = event.detail.value.toLowerCase();
            this.sourceList = this.sourceList.filter(country =>
                country.label.toLowerCase().includes(searchKey)
            );
        }
    
        handleSelectionChange(event) {
            this.selectedList = [...event.detail.value]; // Update selectedList with new reference
            this.updateSelectedCountries(); // Keep flow in sync
            console.log('Selected Countries after change:', this.selectedCountries);
        }
    
        dispatchFlowAttributeChange(attributeName, value) {
            this.dispatchEvent(new FlowAttributeChangeEvent(attributeName, value));
            console.log(`Dispatched Flow Attribute Change: ${attributeName} = ${value}`);
        }
    }