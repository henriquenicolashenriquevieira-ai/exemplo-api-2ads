import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';

const router = Router();

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.get('/:id/orders', customerController.listOrders);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

export default router;
