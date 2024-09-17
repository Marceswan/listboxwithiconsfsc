public with sharing class CountryMetadataController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getCountries() {
        List<Map<String, String>> countries = new List<Map<String, String>>();

        for (Country__mdt country : [SELECT Country_Name__c, Icon__c, Region__c FROM Country__mdt]) {
            Map<String, String> countryMap = new Map<String, String>();
            countryMap.put('label', country.Country_Name__c);
            countryMap.put('value', country.Country_Name__c);
            countryMap.put('avatar', country.Icon__c);
            countryMap.put('group', country.Region__c);
            countries.add(countryMap);
        }

        return countries;
    }
}