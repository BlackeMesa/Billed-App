/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent, getByTestId, render } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bill from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import { formatDate, formatStatus } from "../app/format.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  test("Attache un événement 'click' au bouton 'buttonNewBill' si présent dans le DOM", () => {
    // Créer un faux document avec le bouton
    const document = {
      querySelector: jest.fn().mockReturnValue({ addEventListener: jest.fn() }),
      querySelectorAll: jest.fn().mockReturnValue([]),
    };

    // Créer un faux onNavigate
    const onNavigate = jest.fn();

    // Créer une instance de Bill
    const bill = new Bill({ document, onNavigate });

    // Vérifier si l'événement 'click' est attaché au bouton
    expect(document.querySelector).toHaveBeenCalledWith('button[data-testid="btn-new-bill"]');
    expect(document.querySelector().addEventListener).toHaveBeenCalledWith("click", bill.handleClickNewBill);
  });

  test("Attache un événement 'click' à chaque icône 'iconEye' si présentes dans le DOM", () => {
    // Créer de fausses icônes 'iconEye'
    const iconEyes = [{ addEventListener: jest.fn() }, { addEventListener: jest.fn() }];

    // Créer un faux document avec les icônes 'iconEye'
    const document = {
      querySelector: jest.fn().mockReturnValue(null),
      querySelectorAll: jest.fn().mockReturnValue(iconEyes),
    };

    // Créer un faux onNavigate
    const onNavigate = jest.fn();

    // Créer une instance de Bill
    const bill = new Bill({ document, onNavigate });

    // Vérifier si l'événement 'click' est attaché à chaque icône 'iconEye'
    expect(document.querySelectorAll).toHaveBeenCalledWith('div[data-testid="icon-eye"]');
    iconEyes.forEach((icon) => {
      expect(icon.addEventListener).toHaveBeenCalled();
    });
  });
  test("La fonction handleClickNewBill appelle onNavigate avec le bon paramètre", () => {
    // Créer un faux document sans boutons ni icônes
    const document = {
      querySelector: jest.fn().mockReturnValue(null),
      querySelectorAll: jest.fn().mockReturnValue([]),
    };

    // Créer un faux onNavigate
    const onNavigate = jest.fn();

    // Créer une instance de Bill
    const bill = new Bill({ document, onNavigate });

    // Appeler la fonction handleClickNewBill
    bill.handleClickNewBill();

    // Vérifier si la fonction onNavigate a été appelée avec le bon paramètre
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
  });

  test("La fonction handleClickIconEye affiche la modale avec le bon contenu HTML", () => {
    // Créer un faux document avec une icône 'iconEye'
    const iconEye = { getAttribute: () => "data-bill-url" };
    const document = new DOMParser().parseFromString(
      `
      <div id="modaleFile" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-body"></div>
          </div>
        </div>
      </div>
    `,
      "text/html"
    );

    const mockModal = jest.fn();
    const mockFind = jest.fn(() => $({ html: mockHtml }));
    const mockHtml = jest.fn();

    $.fn.modal = mockModal;
    $.fn.find = mockFind;
    $.fn.html = mockHtml;

    // Créer un faux onNavigate
    const onNavigate = jest.fn();

    // Créer une instance de Bill
    const bill = new Bill({ document, onNavigate });

    // Appeler la fonction handleClickIconEye avec une icône 'iconEye'
    bill.handleClickIconEye(iconEye);

    // Vérifier si la modale est affichée avec le bon contenu HTML
    const modalBody = document.querySelector(".modal-body");
    const imgWidth = Math.floor(document.querySelector("#modaleFile").clientWidth * 0.5);
    const expectedContent = `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${iconEye.getAttribute()} alt="Bill" /></div>`;
    expect(mockFind).toHaveBeenCalledWith(".modal-body");
    expect(mockHtml).toHaveBeenCalledWith(expectedContent);

    // Vérifier si la modale est affichée
    expect(mockModal).toHaveBeenCalledWith("show");
  });
});



// test d'intégration GET
describe("Bills - getBills", () => {
  let mockStore;
  let mockDocument;
  let mockLocalStorage;
  let mockOnNavigate;
  let billsInstance;

  beforeEach(() => {
    mockStore = {
      bills: () => ({
        list: () =>
          Promise.resolve([
            {
              id: "1",
              date: "2023-04-28",
              status: "accepted",
            },
            {
              id: "2",
              date: "2023-04-27",
              status: "refused",
            },
          ]),
      }),
    };

    mockDocument = { querySelector: jest.fn(), querySelectorAll: jest.fn() };
    mockLocalStorage = {};

    mockOnNavigate = jest.fn();
    billsInstance = new Bill({
      document: mockDocument,
      onNavigate: mockOnNavigate,
      store: mockStore,
      localStorage: mockLocalStorage,
    });
  });

  it("doit retourner les factures formatées", async () => {
    const bills = await billsInstance.getBills();

    expect(bills).toEqual([
      {
        id: "1",
        date: formatDate("2023-04-28"),
        status: formatStatus("accepted"),
      },
      {
        id: "2",
        date: formatDate("2023-04-27"),
        status: formatStatus("refused"),
      },
    ]);
  });
});


describe("Given I am a user connected ", () => {
  describe("When I navigate into MainPage", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "user", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Justificatif"));
      expect(screen.getByTestId("tbody")).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
     test("fetches bills from an API and fails with 404 message error", async () => {
       const html = BillsUI({ error: "Erreur 404" });
       document.body.innerHTML = html;
       const message = await screen.getByText(/Erreur 404/);
       expect(message).toBeTruthy();
     });

      test("fetches messages from an API and fails with 500 message error", async () => {
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
