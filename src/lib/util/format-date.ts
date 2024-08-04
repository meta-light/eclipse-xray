export default (timestamp: number) => {
    if (!timestamp) {
        return "";
    }

    const date =
        String(timestamp).length < 13
            ? new Date(timestamp * 1000)
            : new Date(timestamp);

    return Intl.DateTimeFormat(undefined, {
        day: "numeric",
        hour: "numeric",
        minute: "numeric",

        month: "numeric",
        year: "2-digit",
    }).format(date);
};
