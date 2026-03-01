module.exports = function checkPermission(interaction, cfg) {
    const member = interaction.member;
    if (!member) return false;

    // 1️⃣ User whitelist
    if (
        Array.isArray(cfg.permission?.user) &&
        cfg.permission.user.includes(interaction.user.id)
    ) {
        return true;
    }

    // 2️⃣ Role whitelist
    if (
        Array.isArray(cfg.permission?.role) &&
        cfg.permission.role.length > 0 &&
        member.roles.cache.some(r => cfg.permission.role.includes(r.id))
    ) {
        return true;
    }

    // 3️⃣ Không có quyền nào được cấu hình → cho phép
    const noRule =
        (!cfg.permission?.user || cfg.permission.user.length === 0) &&
        (!cfg.permission?.role || cfg.permission.role.length === 0);

    return noRule;
};