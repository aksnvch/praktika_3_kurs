import adminService from '../services/adminService.js';

class AdminController {
    async getBlacklist(req, res, next) {
        try {
            const blacklist = await adminService.getBlacklist();
            return res.json(blacklist); 
        } catch (error) {
            next(error);
        }
    }

    async addToBlacklist(req, res, next) {
        try {
            const { telegramId, reason } = req.body;
            if (!telegramId || !reason) {
                return res.status(400).json({ message: 'Telegram ID and reason are required' });
            }
            const [user, created] = await adminService.addToBlacklist(telegramId, reason);
            return res.status(created ? 201 : 200).json(user); 
        } catch (error) {
            next(error);
        }
    }

    async removeFromBlacklist(req, res, next) {
        try {
            const success = await adminService.removeFromBlacklist(req.params.telegramId);
            if (!success) {
                return res.status(404).json({ message: 'User not found in blacklist' });
            }
            return res.status(204).end(); 
        } catch (error) {
            next(error);
        }
    }
}

export default new AdminController();