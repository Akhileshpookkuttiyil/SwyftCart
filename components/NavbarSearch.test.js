import {
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavbarSearch from "./NavbarSearch";
import { fetchProductListRequest } from "@/lib/api/products";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("next/image", () => {
  return function MockImage(props) {
    return <img {...props} />;
  };
});

jest.mock("@/lib/api/products", () => ({
  fetchProductListRequest: jest.fn(),
}));

jest.mock("@/lib/productCatalog", () => ({
  normalizeProductRecord: (product) => product,
}));

describe("NavbarSearch Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("shows search input when search icon clicked", async () => {
    const user = userEvent.setup();

    render(<NavbarSearch />);

    expect(
      screen.queryByPlaceholderText("Search products...")
    ).not.toBeInTheDocument();

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    expect(
      screen.getByPlaceholderText("Search products...")
    ).toBeInTheDocument();
  });

  test("allows user to type in search input", async () => {
    const user = userEvent.setup();

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "iphone");

    expect(input).toHaveValue("iphone");
  });

  test("clears input when clear button clicked", async () => {
    const user = userEvent.setup();

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "iphone");

    expect(input).toHaveValue("iphone");

    const clearButton = screen.getByRole("button");

    await user.click(clearButton);

    expect(input).toHaveValue("");
  });

  test("redirects when Enter key is pressed", async () => {
    const user = userEvent.setup();

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "iphone{enter}");

    expect(pushMock).toHaveBeenCalledWith(
      "/all-products?search=iphone"
    );
  });

  test("shows no results message", async () => {
    const user = userEvent.setup();

    fetchProductListRequest.mockResolvedValue({
      success: true,
      products: [],
    });

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "samsung");

    await waitFor(() => {
      expect(
        fetchProductListRequest
      ).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(
        /No results found for/i
      )
    ).toBeInTheDocument();
  });

  test("fetches and displays suggestions after debounce", async () => {
    jest.useFakeTimers();

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    fetchProductListRequest.mockResolvedValue({
      success: true,
      products: [
        {
          _id: "1",
          name: "iPhone 15",
          category: "Mobiles",
          image: ["/iphone.jpg"],
        },
      ],
    });

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "iphone");

    expect(fetchProductListRequest)
      .not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(
        fetchProductListRequest
      ).toHaveBeenCalledWith({
        search: "iphone",
        limit: 5,
      });
    });

    expect(
      await screen.findByText("iPhone 15")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Mobiles")
    ).toBeInTheDocument();
  });

  test("redirects to product page when suggestion clicked", async () => {
    jest.useFakeTimers();

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    fetchProductListRequest.mockResolvedValue({
      success: true,
      products: [
        {
          _id: "99",
          name: "MacBook Pro",
          category: "Laptops",
          image: ["/macbook.jpg"],
        },
      ],
    });

    render(<NavbarSearch />);

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    const input = screen.getByPlaceholderText(
      "Search products..."
    );

    await user.type(input, "macbook");

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    const suggestion = await screen.findByText(
      "MacBook Pro"
    );

    await user.click(suggestion);

    expect(pushMock).toHaveBeenCalledWith(
      "/product/99"
    );
  });

  test("closes search when clicking outside", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <NavbarSearch />
        <button>Outside</button>
      </div>
    );

    const searchIcon = screen.getByAltText("Search");

    await user.click(searchIcon);

    expect(
      screen.getByPlaceholderText("Search products...")
    ).toBeInTheDocument();

    const outsideButton = screen.getByText("Outside");

    await user.click(outsideButton);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText(
          "Search products..."
        )
      ).not.toBeInTheDocument();
    });
  });
});