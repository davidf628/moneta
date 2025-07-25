# Moneta
This is an online version of the budgeting app of the same name I wrote years ago in Java. I've decided 
to re-write it in Node so that I can access it from different devices and not always have to access the 
famiy budgeting information from a desktop or laptop computer.

The main database will be a **mariadb** instead of a simple text-file, and I will add some charting and
advanced aggregation features as the program gets built out.

The main database is named **moneta_db** and this contains three tables, one for saved **preferences**, one for **accounts**, another for **budgetitems** and one more for **transactions**. The structure of each database is as follows:

#### preferences

* **user** - the name of the user associated with a set of preferences
* **current_month** - the last month that was loaded into the editor
* **current_year** - the last year that was loaded into the editor
* **current_account** - the last account that was loaded into the editor

#### accounts:

* **id** - unique reference ID given to each account automatically
* **name** - the name of the account
* **type** - an enumerated type of the account, which can be *credit*, *debit*, *checking*, *savings*, *loan*, or *investment*

#### budgetitems:

* **id** - unique reference ID given to each budget item automatically
* **name** - the name of the budget item
* **amount** - the amount set for the budget, which is a numeric value with two decimal places
* **orderbyte** - a value that allows the user to sort the budget items in any way they want
* **increment** - some budget items have an automatic increment each month, this value will be applied to the budget item when a new month is created
* **year** - the year as a four-digit number
* **month** - the month for the budget item from an enumerated set of *January*, *February*, *March*, etc.
* **account** - an ID lookup to the account this item is associated with

#### transactions:

* **id** - unique reference ID for each transaction
* **date** - the date of the transaction
* **name** - the name of the transaction occurring
* **credit** - the amount posted to the account
* **debit** - the amount spent from the account
* **memo** - a boolean value of 1 or 0 indicating whether this charge has posted yet or not
* **budgetitem** - an ID from a budget item linking each transaction to a budget category
* **local** - a boolean value of 1 or 0 indicating whether this charge occurred locally or not
* **year** - the year as a four-digit number
* **month** - the month for the budget item from an enumerated set of *January*, *February*, *March*, etc.
* **orderbyte** - a value that allows the user to sort the budget items in any way they want
* **account** - an ID from an account this transaction is assocated with

