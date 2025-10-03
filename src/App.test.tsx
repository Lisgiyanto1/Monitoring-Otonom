import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import App from "./App";
import React from "react";

jest.mock("./components/petamqtt", () => () => <div data-testid="peta-mqtt">Mocked PetaMqtt</div>);

describe("App Component", () => {
    it("merender komponen PetaMqtt", () => {
        render(
            <App />
        );
        const petaMqttElement = screen.getByTestId("peta-mqtt");
        expect(petaMqttElement).toBeInTheDocument();
    });
});
