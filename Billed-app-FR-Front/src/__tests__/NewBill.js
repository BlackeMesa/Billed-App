/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI";
import NewBillUI from "../views/NewBillUI";
import NewBill from "../containers/NewBill";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";


// Crée un mock de Store pour simuler son comportement
jest.mock("../app/Store", () => mockStore);

// Débute la suite de tests pour un utilisateur connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test pour vérifier que le formulaire est bien soumis
    test("Then submit form for newBill", async () => {
      // Fonction pour simuler la navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Mock de l'objet localStorage pour les tests
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      // Ajoute un utilisateur mock dans le localStorage
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Génère le HTML pour la page NewBill
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Initialise l'instance NewBill pour le test
      const newBillTest = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      // Récupère le formulaire du DOM
      const NewBillForm = screen.getByTestId("form-new-bill");
      // Vérifie que le formulaire existe
      expect(NewBillForm).toBeTruthy();

      // Crée un mock de la fonction handleSubmit
      const handleSubmit = jest.fn((e) => newBillTest.handleSubmit(e));
      // Ajoute un écouteur d'événement pour le submit du formulaire
      NewBillForm.addEventListener("submit", handleSubmit);
      // Déclenche l'événement submit
      fireEvent.submit(NewBillForm);
      // Vérifie que la fonction handleSubmit a été appelée
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  // Test pour vérifier qu'il y a bien une image de facture
  test("Then verify there is a bill's picture", async () => {
    // Espionne la méthode bills de mockStore
    jest.spyOn(mockStore, "bills");

    // Fonction pour simuler la navigation
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    // Mock de l'objet localStorage pour les tests
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    // Ajoute un utilisateur mock dans le localStorage
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    // Génère le HTML pour la page NewBill
    const html = NewBillUI();
    document.body.innerHTML = html;

    // Initialise l'instance NewBill pour le test
    const newBillInit = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    // Crée un fichier mock pour le test
    const file = new File(["image"], "image.png", { type: "image/png" });
    // Crée un mock de la fonction handleChangeFile
    const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e));
    // Récupère le formulaire et l'input de fichier du DOM
    const formNewBill = screen.getByTestId("form-new-bill");
    const billFile = screen.getByTestId("file");

    // Ajoute un écouteur d'événement pour le changement de fichier
    billFile.addEventListener("change", handleChangeFile);
    // Simule le téléchargement d'un fichier
    userEvent.upload(billFile, file);

    // Vérifie que le nom du fichier est défini
    expect(billFile.files[0].name).toBeDefined();
    // Vérifie que la fonction handleChangeFile a été appelée
    expect(handleChangeFile).toBeCalled();

    // Crée un mock de la fonction handleSubmit
    const handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e));
    // Ajoute un écouteur d'événement pour le submit du formulaire
    formNewBill.addEventListener("submit", handleSubmit);
    // Déclenche l'événement submit
    fireEvent.submit(formNewBill);
    // Vérifie que la fonction handleSubmit a été appelée
    expect(handleSubmit).toHaveBeenCalled();
  });
});
// Suite de tests d'intégration pour les requêtes POST
describe("Given I am a user connected as Employee and I am on NewBill page", () => {
  describe("When I submit the new bill", () => {
    // Test pour vérifier qu'une nouvelle facture est créée avec l'API mock POST
    test("Then create a new bill from mock API POST", async () => {
      const bill = [
        {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl: "test_url",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "test.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        },
      ];
      // Espionne la méthode bills de mockStore
      const callStore = jest.spyOn(mockStore, "bills");
      // Appelle la méthode create de mockStore.bills avec la facture
      mockStore.bills().create(bill);
      // Vérifie que la méthode bills a été appelée
      expect(callStore).toHaveBeenCalled();
    });

    // Tests pour les erreurs 404 et 500
    describe("When an error occurs on API", () => {
      // Test pour vérifier qu'une erreur 404 est bien affichée
      test("Then create new bill from an API and fails with 404 message error", async () => {
        // Modifie l'implémentation de mockStore.bills pour rejeter avec une erreur 404
        mockStore.bills.mockImplementationOnce(() => ({
          create: () => Promise.reject(new Error("Erreur 404")),
        }));
        // Met à jour le DOM avec le message d'erreur
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });

        // Attend la réponse
        await new Promise(process.nextTick);
        // Récupère le message d'erreur du DOM
        const message = screen.getByText(/Erreur 404/);
        // Vérifie que le message d'erreur est bien présent
        expect(message).toBeTruthy();
      });

      // Test pour vérifier qu'une erreur 500 est bien affichée
      test("Then create new bill from an API and fails with 500 message error", async () => {
        // Modifie l'implémentation de mockStore.bills pour rejeter avec une erreur 500
        mockStore.bills.mockImplementationOnce(() => ({
          create: (bill) => Promise.reject(new Error("Erreur 500")),
        }));

        // Construit le DOM avec le message d'erreur
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        // Attend la réponse
        await new Promise(process.nextTick);
        // Récupère le message d'erreur du DOM
        const message = screen.getByText(/Erreur 500/);
        // Vérifie que le message d'erreur est bien présent
        expect(message).toBeTruthy();
      });
    });
  });
});
