export function sort_months(months) {

    // define the proper order of months
    const month_order = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Sort using the monthOrder index
    const sorted = months.sort(
        (a, b) => month_order.indexOf(a) - month_order.indexOf(b)
    );

    return sorted;
}