import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "./ProductCard";

jest.mock("next/image", () => {
  return function MockImage(props) {
    return <img {...props} />;
  };
});

jest.mock("next/link", () => {
  return function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("@/store/useUserStore", () => ({
  useUserStore: jest.fn(),
}));

jest.mock("@/hooks/useFavorites", () => {
  return jest.fn();
});

import { useUserStore } from "@/store/useUserStore";
import useFavorites from "@/hooks/useFavorites";

describe("ProductCard Component", () => {
  const mockToggleFavorite = jest.fn();

  beforeEach(() => {
    useUserStore.mockImplementation((selector) =>
      selector({
        currency: "₹",
      })
    );

    useFavorites.mockReturnValue({
      toggleFavorite: mockToggleFavorite,
      isFavorite: jest.fn(() => false),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct = {
    _id: "123",
    name: "iPhone 15",
    description: "Latest Apple smartphone",
    offerPrice: 79999,
    rating: 4.5,
    image: ["/iphone.jpg"],
  };

  test("renders product information correctly", () => {
    render(<ProductCard product={mockProduct} />);

    expect(
      screen.getByText("iPhone 15")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Latest Apple smartphone")
    ).toBeInTheDocument();

    expect(
      screen.getByText("₹79,999.00")
    ).toBeInTheDocument();

    expect(
      screen.getByText("4.5")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /add to favorites/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link")
    ).toHaveAttribute("href", "/product/123");
  });

  test("calls toggleFavorite when favorite button is clicked", async () => {
    const user = userEvent.setup();

    render(<ProductCard product={mockProduct} />);

    const favoriteButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    await user.click(favoriteButton);

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);

    expect(mockToggleFavorite).toHaveBeenCalledWith("123");
  });

  test("shows remove from favorites when product is favorited", () => {
    useFavorites.mockReturnValue({
      toggleFavorite: mockToggleFavorite,
      isFavorite: jest.fn(() => true),
    });

    render(<ProductCard product={mockProduct} />);

    expect(
      screen.getByRole("button", {
        name: /remove from favorites/i,
      })
    ).toBeInTheDocument();
  });
});