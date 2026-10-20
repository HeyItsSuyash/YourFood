export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in rupees ₹
  category: "food" | "bowls" | "pasta" | "drinks" | "dessert";
  imageUrl?: string;
  isPopular?: boolean;
}

export const MOCK_MENU: MenuItem[] = [
  {
    id: "farmhouse-bowl",
    name: "Farmhouse Bowl",
    description: "Grilled vegetables, quinoa, house sauce, fresh herbs.",
    price: 249,
    category: "food",
    isPopular: true,
  },
  {
    id: "peri-peri-chicken",
    name: "Peri Peri Chicken Bowl",
    description: "Spicy grilled chicken, brown rice, seasonal vegetables.",
    price: 279,
    category: "food",
    isPopular: true,
  },
  {
    id: "pasta-alfredo",
    name: "Pasta Alfredo",
    description: "Creamy Alfredo sauce, parmesan, herbs, garlic bread.",
    price: 229,
    category: "food",
  },
  {
    id: "truffle-agnolotti",
    name: "Wild Mushroom Agnolotti",
    description: "Brown butter emulsion, shaved Norcia black truffle.",
    price: 349,
    category: "food",
  },
  {
    id: "smoked-old-fashioned",
    name: "Smoked Botanist Elixir",
    description: "Cold brewed botanicals, ignited cherrywood smoke chamber.",
    price: 189,
    category: "drinks",
  },
  {
    id: "valrhona-souffle",
    name: "Valrhona 72% Dark Soufflé",
    description: "Baked to order, Tahitian vanilla bean creme anglaise, gold leaf.",
    price: 199,
    category: "dessert",
  },
];

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface PrizeOption {
  id: string;
  title: string;
  description: string;
  category: string;
  discountText: string;
}

export const MOCK_PRIZES: PrizeOption[] = [
  {
    id: "prize-souffle",
    title: "Complimentary Valrhona Soufflé",
    description: "Baked to order with Tahitian vanilla bean creme & gold leaf.",
    category: "Complimentary Dessert",
    discountText: "100% Free",
  },
  {
    id: "prize-25-off",
    title: "25% Off Entire Dining Experience",
    description: "Applicable on your next visit across all handcrafted bowls.",
    category: "Percentage Voucher",
    discountText: "25% OFF",
  },
  {
    id: "prize-100-voucher",
    title: "₹150 Food & Beverage Credit",
    description: "Direct discount on any artisan main or crafted drink.",
    category: "Dining Credit",
    discountText: "₹150 Credit",
  },
  {
    id: "prize-pairing",
    title: "Sommelier Special Drink Pairing",
    description: "Complimentary pairing on your next table reservation.",
    category: "Chef Reserve",
    discountText: "Complimentary",
  },
];