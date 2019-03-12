# Outlier detection

Cenote's online outlier detection technique will be based on the 2005 paper entitled: "Data Outlier Detection using the Chebyshev Theorem". We have adapted the offline version provided in the paper into an online version to fit our needs. 

*Decision 1:* All the data are written to Cenote. Being outliers or not. We do this in order for Cenote to be the single source of truth and apply on the data functions to retrieve the outliers or not.

*Decision 2:* A p value of 0.05 is selected.

*Decision 3:* We choose the non-unimodal case.

## Outlier detection: normal mode of operation

Write data:

1. A numeric property is send to be written in Cenote.
2. Use the numeric property to update running average and variance stored in a system like Redis.
3a. If the numeric property is more extreme than the ODV (Outlier Detection Value) then continue with storage.
3b. If the numeric property is not an outlier then update the 2nd pair of running average and variance.

Read data:

In all API calls there will be a query param named `outliers`. The default value will be 'include', but there will be tow other values: 'exclude' and 'only'. Include will include all outliers in the queries, exclude will exclude them and only will only use the outliers. After fetching the batch based on query params, the ODV values will be based on the 2nd pair of running averages and variance.

## When bootstrapping Cenote

There maybe cases where this temporary storage does not contain any values. In such cases, the I/O will take somewhat longer in order to store the values of mean and standard deviation for the given property.
