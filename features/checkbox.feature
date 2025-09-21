Feature: Generate test data for checkbox inputs
  As a test engineer
  I want to generate multiple records of checkbox test data
  So that I can validate fields with multiple input combinations

  Background:
    Given the page contains checkbox groups

  Scenario: Generate 5 records for a single checkbox group
    Given I inspect checkbox groups and find a group named "interests" with 4 options
    When I request 5 records with 2 selected per record
    Then I should receive a table with 5 rows and columns: fieldName, options, selected

  Scenario: Export generated data as CSV for bulk testing
    Given I inspected two checkbox groups: "colors" (3 options) and "sizes" (4 options)
    When I ask for 3 records for each group
    Then I should get a CSV formatted table with headers "fieldName,options,selected"
