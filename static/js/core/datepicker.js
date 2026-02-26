const DatePicker = {
    init(selector, defaultDate, onChange) {
        flatpickr(selector, {
            locale: "pl",
            dateFormat: "Y-m-d",
            defaultDate,
            onChange: (_, dateStr) => onChange(dateStr)
        });
    }
};