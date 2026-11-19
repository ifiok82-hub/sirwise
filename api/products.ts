import { getProductsList, type ApiRequest, type ApiResponse } from './_store';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const products = getProductsList();
  res.status(200).json(products);
}
