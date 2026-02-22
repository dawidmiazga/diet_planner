from flask import Flask, render_template, request, jsonify
from collections import defaultdict
import json
from datetime import datetime
import os


app = Flask(__name__)


# =====================================================
# PLIKI
# =====================================================

PRODUCTS_FILE = "products.json"
MEALS_FILE = "meals.json"
PLANNER_FILE = "planner_data.json"
START_DATE_FILE = "start_date.json"
SHOPPING_STATE_FILE = "shopping_state.json"


# =====================================================
# STAŁE
# =====================================================

JEDNOSTKI = [
    "gram",
    "opakowanie",
    "plaster",
    "łyżka",
    "listek",
    "sztuka",
    "łyżeczka",
    "szklanka",
    "kromka",
    "szczypta",
    "ząbek",
    "garść",
]

DZIALY = [
    "Bakalie",
    "Chłodnia / produkty sojowe",
    "Chłodnia / produkty wegańskie",
    "Konserwy / strączki",
    "Kuchnia azjatycka",
    "Kuchnia azjatycka / orientalna",
    "Kuchnia azjatycka / produkty suche",
    "Kuchnia azjatycka / produkty sypkie",
    "Kuchnia azjatycka / przetwory",
    "Kuchnia azjatycka / przyprawy",
    "Kuchnia azjatycka / sekcja orientalna",
    "Kuchnia azjatycka / sosy",
    "Kuchnia azjatycka / strefa bio",
    "Mięso / chłodnia",
    "Mrożonki",
    "Mrożonki (lody)",
    "Mrożonki / warzywa mrożone",
    "Nabiał / chłodnia",
    "Nabiał / chłodnia (lub roślinne napoje)",
    "Nabiał / chłodnia (lub strefa bio)",
    "Nabiał / chłodnia (strefa wegańska)",
    "Nabiał / chłodnia / bez laktozy",
    "Nabiał / chłodnia / desery proteinowe",
    "Nabiał / chłodnia / napoje roślinne",
    "Nabiał / chłodnia / sekcja napojów/ desery roślinne",
    "Nabiał / chłodnia / sekcja roślinna",
    "Nabiał / chłodnia / sery pleśniowe",
    "Nabiał / chłodnia / sery twarde",
    "Nabiał / chłodnia / sery żółte",
    "Nabiał / chłodnia / zdrowa żywność",
    "Nabiał / sery twarde",
    "Napoje / chłodnia / świeże soki",
    "Napoje / kawa / napoje bez cukru",
    "Napoje / smoothie / chłodnia",
    "Napoje / soki",
    "Napoje / woda mineralna",
    "Oleje i tłuszcze",
    "Orzechy i bakalie",
    "Piekarnia / pieczywo",
    "Piekarnia / pieczywo (lub dział pieczywa miękkiego)",
    "Piekarnia / pieczywo chłodzone",
    "Piekarnia / pieczywo chłodzone lub mrożonki",
    "Produkty chłodzone lub mrożone (włoska kuchnia)",
    "Produkty spożywcze / dział dań gotowych",
    "Produkty suche / artykuły sypkie",
    "Produkty suche / artykuły sypkie (lub bezglutenowe)",
    "Produkty suche / artykuły sypkie (lub kuchnia azjatycka)",
    "Produkty suche / bakalie",
    "Produkty suche / cukiernicze / dodatki",
    "Produkty suche / do pieczenia",
    "Produkty suche / dodatki",
    "Produkty suche / konserwy",
    "Produkty suche / kuchnia orientalna",
    "Produkty suche / płatki śniadaniowe",
    "Produkty suche / przyprawy",
    "Produkty suche / przyprawy / cukiernicze",
    "Produkty suche / strączki",
    "Produkty suche / zdrowa żywność",
    "Produkty wegańskie / chłodnia",
    "Przekąski / bakalie",
    "Przekąski / chipsy",
    "Przekąski / zdrowa żywność / batony",
    "Przetwory / dodatki",
    "Przetwory / dodatki smakowe",
    "Przetwory / dżemy",
    "Przetwory / kiszonki",
    "Przetwory / konserwy",
    "Przetwory / kuchnia śródziemnomorska",
    "Przetwory / słodycze",
    "Przetwory / soki / dodatki",
    "Przetwory / sosy",
    "Przetwory / sosy (lub strefa bio)",
    "Przetwory / sosy / kuchnia włoska",
    "Przetwory / sosy / przyprawy",
    "Przetwory / zdrowa żywność",
    "Przetwory / zdrowe tłuszcze",
    "Ryby / chłodnia",
    "Słodycze / kremy do smarowania",
    "Słodycze / zdrowe przekąski",
    "Warzywa / chłodzone przetwory",
    "Warzywa i owoce świeże",
    "Warzywa i owoce świeże (chłodnia)",
    "Warzywa i owoce świeże (lub mrożonki jarmuż)",
    "Warzywa i owoce świeże (lub mrożonki)",
    "Warzywa i owoce świeże (lub zioła świeże)",
    "Warzywa i owoce świeże / chłodnia",
    "Warzywa i owoce świeże / dział sałat",
    "Warzywa/Owoce świeże lub mrożone",
    "Wędliny / chłodnia",
    "Wędliny / mięso / chłodnia",
    "Zdrowa żywność / produkty roślinne",
    "Zdrowa żywność / produkty suche",
    "Zdrowa żywność / produkty sypkie",
    "Zdrowa żywność / suplementy / sport",
    "Zioła i przyprawy",
    "Zioła i przyprawy / dodatki cukiernicze",
    "Zioła i przyprawy / przyprawy indyjskie",
    "Zioła i przyprawy / sekcja egzotyczna",
    "Zioła i przyprawy / sezonowe",
]


# =====================================================
# UI STATE
# =====================================================


def load_ui_state():
    if not os.path.exists(START_DATE_FILE):
        return {
            "planner": {"start_date": None},
            "shopping": {"start_date": None, "end_date": None},
        }

    with open(START_DATE_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {
                "planner": {"start_date": None},
                "shopping": {"start_date": None, "end_date": None},
            }


def save_ui_state(state):
    with open(START_DATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=4)


# =====================================================
# API – DATY
# =====================================================


@app.route("/api/get_planner_date", methods=["GET"])
def get_planner_date():
    state = load_ui_state()
    return jsonify(state.get("planner", {}))


@app.route("/api/save_planner_date", methods=["POST"])
def save_planner_date():
    data = request.json
    state = load_ui_state()

    state["planner"] = {"start_date": data.get("start_date")}

    save_ui_state(state)
    return jsonify({"status": "ok"})


@app.route("/api/get_shopping_dates", methods=["GET"])
def get_shopping_dates():
    state = load_ui_state()
    return jsonify(state.get("shopping", {}))


@app.route("/api/save_shopping_dates", methods=["POST"])
def save_shopping_dates():
    data = request.json
    state = load_ui_state()

    state["shopping"] = {
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
    }

    save_ui_state(state)
    return jsonify({"status": "ok"})


# =====================================================
# PRODUKTY
# =====================================================


def load_products():
    if not os.path.exists(PRODUCTS_FILE):
        return []

    try:
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_products(products):
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=4)


@app.route("/api/products", methods=["GET"])
def get_products():
    return jsonify(load_products())


@app.route("/api/products", methods=["POST"])
def add_product():
    products = load_products()
    new_product = request.json

    if products:
        max_id = max(p.get("id", 0) for p in products)
    else:
        max_id = 0

    new_product["id"] = max_id + 1

    if "makro" not in new_product:
        new_product["makro"] = {"kcal": 0, "b": 0, "t": 0, "w": 0}

    products.append(new_product)
    save_products(products)

    return jsonify(new_product), 201


@app.route("/api/products/<int:id>", methods=["PUT"])
def update_product(id):
    products = load_products()
    updated_data = request.json

    for p in products:
        if p.get("id") == id:
            p.update(updated_data)
            break

    save_products(products)
    return "", 204


@app.route("/api/products/<int:id>", methods=["DELETE"])
def delete_product(id):
    products = load_products()
    products = [p for p in products if p.get("id") != id]
    save_products(products)
    return "", 204


# =====================================================
# DANIA
# =====================================================


def load_meals():
    try:
        with open(MEALS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_meals(meals):
    with open(MEALS_FILE, "w", encoding="utf-8") as f:
        json.dump(meals, f, ensure_ascii=False, indent=4)


@app.route("/dania")
def meals_page():
    return render_template("dania.html")


@app.route("/api/meals", methods=["GET"])
def get_meals():
    meals = load_meals()
    person = request.args.get("person")
    day = request.args.get("day", type=int)

    if person:
        meals = [m for m in meals if m.get("person") == person]

    if day is not None:
        meals = [
            m
            for m in meals
            if isinstance(m.get("dish"), list) and day in m.get("dish", [])
        ]

    return jsonify(meals)


@app.route("/api/meals", methods=["POST"])
def add_meal():
    meals = load_meals()
    new_meal = request.json

    if meals:
        max_id = max(m.get("id", 0) for m in meals)
    else:
        max_id = 0

    new_meal["id"] = max_id + 1
    meals.append(new_meal)
    save_meals(meals)

    return jsonify(new_meal), 201


@app.route("/api/meals/<int:id>", methods=["PUT"])
def update_meal(id):
    meals = load_meals()
    updated_data = request.json

    for m in meals:
        if m.get("id") == id:
            m.update(updated_data)
            break

    save_meals(meals)
    return "", 204


@app.route("/api/meals/<int:id>", methods=["DELETE"])
def delete_meal(id):
    meals = load_meals()
    meals = [m for m in meals if m.get("id") != id]
    save_meals(meals)
    return "", 204


# =====================================================
# PLANNER
# =====================================================


@app.route("/")
@app.route("/planner")
def planner():
    return render_template("planner.html")


@app.route("/api/save_planner", methods=["POST"])
def save_planner():
    data = request.get_json()

    with open(PLANNER_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    return jsonify({"status": "ok"})


@app.route("/api/load_planner")
def load_planner():
    if not os.path.exists(PLANNER_FILE):
        return jsonify({"osoba1": {}, "osoba2": {}})

    if os.path.getsize(PLANNER_FILE) == 0:
        return jsonify({"osoba1": {}, "osoba2": {}})

    try:
        with open(PLANNER_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        return jsonify({"osoba1": {}, "osoba2": {}})

    return jsonify(data)


# =====================================================
# ZAKUPY
# =====================================================


def load_shopping_state():
    if not os.path.exists(SHOPPING_STATE_FILE):
        return {}

    try:
        with open(SHOPPING_STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def save_shopping_state(state):
    with open(SHOPPING_STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=4)


@app.route("/zakupy")
def shopping_page():
    return render_template("shopping.html")


@app.route("/produkty")
def produkty_page():
    return render_template("produkty.html", dzialy=DZIALY, jednostki=JEDNOSTKI)


@app.route("/api/shopping_check/<int:product_id>", methods=["POST"])
def check_product(product_id):
    state = load_shopping_state()
    state[str(product_id)] = True
    save_shopping_state(state)
    return jsonify({"status": "ok"})


@app.route("/api/shopping_reset", methods=["POST"])
def reset_shopping():
    save_shopping_state({})
    return jsonify({"status": "reset"})


@app.route("/api/shopping_list", methods=["GET"])
def generate_shopping_list():

    start_str = request.args.get("start")
    end_str = request.args.get("end")

    if not start_str or not end_str:
        return jsonify([])

    start_date = datetime.strptime(start_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_str, "%Y-%m-%d")

    meals = load_meals()
    products = load_products()

    if not os.path.exists(PLANNER_FILE):
        return jsonify([])

    try:
        with open(PLANNER_FILE, "r", encoding="utf-8") as f:
            planner = json.load(f)
    except json.JSONDecodeError:
        return jsonify([])

    product_totals = defaultdict(float)

    for person in planner.values():
        for date_str, meals_for_day in person.items():

            current_date = datetime.strptime(date_str, "%Y-%m-%d")

            if start_date <= current_date <= end_date:

                for meal_id in meals_for_day.values():

                    meal = next((m for m in meals if m.get("id") == meal_id), None)
                    if not meal:
                        continue

                    for ingredient in meal.get("ingredients", []):
                        product_totals[ingredient["id"]] += ingredient.get("grams", 0)

    shopping_list = []
    shopping_state = load_shopping_state()

    for product_id, total_grams in product_totals.items():
        product = next((p for p in products if p["id"] == product_id), None)
        if not product:
            continue

        jednostka_per_gram = product.get("jednostka_per_gram")
        nazwa_jednostki = product.get("nazwa_jednostki")

        ilosc_sztuk = None
        if jednostka_per_gram and jednostka_per_gram > 0:
            ilosc_sztuk = round(total_grams / jednostka_per_gram, 2)

        shopping_list.append(
            {
                "id": product_id,
                "name": product.get("nazwa_produktu"),
                "grams": total_grams,
                "sztuki": ilosc_sztuk,
                "jednostka": nazwa_jednostki,
                "dzial_w_sklepie": product.get("dzial_w_sklepie", "Inne"),
                "czy_w_lodowce": product.get("czy_w_lodowce", "Nie"),
                "checked": shopping_state.get(str(product_id), False),
            }
        )

    shopping_list.sort(key=lambda x: x["dzial_w_sklepie"])

    return jsonify(shopping_list)


# =====================================================
# START
# =====================================================

if __name__ == "__main__":
    # app.run(debug=True) #to ma byc tylko dla develomplentu
    app.run()
