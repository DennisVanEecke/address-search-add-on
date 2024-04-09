# address-search-add-on

To be refined. If you want to test the service run the `./run` bash script. Then you can send your requests to `localhost:9300`.

Below is a part of documentation I wrote to inform developers about the workings of the ember component.

# Introduction to the CLB address search component

> ! This information is only suitable for developers who are familiar with ABB apps consisting of a microservices based backend and an ember based front end. 

> This guide is meant for those wanting to copy the address search into their own ABB app. This ONLY works for ember 5.X apps.

The address search has the following dependencies. Makes sure the app you are copying the source into meets them.

* ember octane (5.X)
* ember-concurrency (^3.1.1)
* ember appuniversum (^2.18.0)

The address search functionality is a core part of edit forms for the CLB app. It provides an automatic way to enter addresses and even the 'manual' input contains some safeguards (at least for Belgian addresses). The component has been designed to be morphed into a new style (embroider) ember add on and used in a general way. It does not output linked data or anything exotic. It's just plain old objects.

The address search system consists of:
- An ember component you can use in your forms whenever you need to query the user for an address (preferably in Flanders)
- A microservice in the backend with REST endpoints the component can call

It also important to add that this address search was inspired by the one in OP, but has been built from scratch.

## How to add the microservice for testing to your backend

An image is not published to docker hub yet. But you can build it using docker. Imagine you have a file structure like this for your backend:

```
|
|-your-app
    |-docker-compose.yml
    |-(other files & folders)
|-address-search-add-on
    |-(The source code pulled from https://github.com/DennisVanEecke/address-search-add-on)
```

Please note that the address search repo will be moved when it has been sufficiently tested, modified and approved.

Just simply add to your docker compose file like this:

```
  address-search-add-on:
    build: ../address-search-add-on/.
    volumes:
      - ../address-search-add-on:/app
      - ./data/address-search-add-on:/data
    environment:
      NODE_ENV: "development"
    restart: always
    logging: *default-logging
```

And add this to your `docker-compose.dev.yml`:

```
  address-search-add-on:
    restart: "no"
```

And finally this to your dispatcher config file:

```
  match "/address-search-add-on/*path" do
    forward conn, path, "http://address-search-add-on"
  end
```

This will add the microservice and route all requests to `/address-search-add-on` to the new microservice. The address search components make requests to this endpoint.

## How to use the address search component in the frontend

In time the address search will be an ember add on. For now you will need to copy these files from CLB app:

```
/app/components/au-address-search.hbs
/app/components/au-address-search.js
/app/components/au-address-search/*.*
/app/styles/project/au-address-search.scss
```

Add this line to your `app.scss`:

```scss
@import "project/au-address-search";
```

Now you can use the component in your templates like this:

```handlebars
<AuAddressSearch
    @id="new-address-search"
    @errorMessage={{this.addressError}}
    @warningMessage={{this.addressWarning}}
    @initialMode="automatic"
    @itemComponent={{Item}}
    @address={{@address}}
    @onChange={{this.handleAddressUpdate}}
/>
```

The address search was not designed to have any child elements. It does not contain a `{{yield}}` directive.

## Optional item parameter

The address search renders appuniversum labels and controls. But if you want you can use your own item component, which structures the labels and controls, by passing a component to the `@itemComponent` attribute. This is important because in this way the address search does not determine the structure of your application much. It always generates a list of whatever item component you specified and populates them with labels and controls. If you don't supply the item component than a default one is used which is minimal. The default one just orients the label above the control(s). Check the source of this default item if you want to make your own.

If you do make your own item component it needs these things:

* A block called `label`
* A block called `content`
* An attribute called `labelFor` which accepts the id of the component associated with the item

In CLB we use an item component which places the label to the left of the control.

The validation part is still being worked on.

## Modes

The address search has two modes: 'manual' and 'automatic'. The former allows the user to fill in all the address lines by hand and the latter provides an API based fuzzy search to find addresses in Flanders.

Using the `@initialMode` parameters you can set the initial mode. The value may either be `automatic` or `manual` or the parameter may be omitted, in which case it defaults to automatic.

## The address object schema

It's difficult to find a standard data structure for addresses. Or did you mean adressen? Maybe you misspelled and wrote adresses instead of addresses? Maybe you are Dutch speaking and you prefer adres over address? Anyway it's address (plural addresses) and I'm sticking with it because it's the correct English spelling. Either you use English or Dutch but not both at the same time, which is why you will not find a word of Dutch in the source of the address search component.

Another problem with addresses is the fact that address schema's are not consistent over all ABB applications. This was a problem when the address search component was designed. The component was designed to be used in all future ABB appuniversum applications.

Address according to OP:

```typescript
type Address = {
    number: unknown;
    boxNumber: unknown;
    street: unknown;
    postcode: unknown;
    municipality: unknown;
    province: unknown;
    addressRegisterUri: unknown;
    country: unknown;
    fullAddress: unknown;
    source: unknown;
}
```

Address according to loket:

```typescript
type Adres = { // Note Dutch spelling of address
    busnummer: unknown;
    huisnummer: unknown;
    straatnaam: unknown;
    postcode: unknown;
    gemeentenaam: unknown;
    land: unknown;
    volledigAdres: unknown;
    adresRegisterId: unknown;
    adresRegisterUri: unknown;
}
```

Because Loket and OP are in Javascript I could not immediately figure out what the exact typing for each value is. Most of them are `string`. Or is that `string | null`? Or `string | undefined`? You get the idea.

There is also an address format according to the 'adressenregister-fuzzy-search-service' which uses the basisregisters API which in turn uses a JSON-LD format. This schema is an RDF based standard but the JSON formatting for it is not very nice to read. 

There is the [OSLO](https://data.vlaanderen.be/ns/adres/) standard as well which is also an RDF based standard. The JSON equivalent of that would be very cumbersome. In the future the linked data should support this standard, but that's on the level of linked data.

To keep things simple the address search component outputs an address in its own simplified format which is designed for addresses in Flanders and which uses English words only in the correct spelling. It's up to the application developer which uses the component to convert its output to the correct schema, as it has been done in the CLB app. It suffices to code two conversion functions. This is the address schema the address search component outputs (typing is exact in this case):

```typescript
type AddressSearchAddress = {
    country: Country; // String with restricted values, only EU
    province: Province; // String with restricted values for addresses in Flanders
    municipality: string;
    postalCode: string;
    street: string;
    houseNumber: string;
    boxNumber: string | null; // A null value is a deliberate designation of NO box number
    complete: boolean | undefined; // Optional value signifying if the address is completely filled in
}
```

Inspiration: [Wikipedia](https://en.wikipedia.org/wiki/Address#Belgium). I did replace 'thoroughfare' with 'street' and 'street number' with 'houseNumber' in order not to alienate everyone in Belgium. It seems the correct spelling of postal code is just that, 'postal code' not 'postcode'. The same goes for box number, not 'bus number'. The province has been added because both loket and OP keep the province in their models. I's advisable to keep the order of the keys the same. They are ordered from less specific to more specific.

Please note the exact data type of `boxNumber`. The value of `null` is a deliberate specification that this address does NOT have a box number. Please note that some buildings have multiple dwellings which have addresses WITH and WITHOUT box numbers. An example of this is the building I live in which contains two dwellings but three different legal addresses:

* Number 7, box `null`
* Number 7A, box `null`
* Number 7, box 0001

So two otherwise identical addresses but one with box number `null` and one with it filled in are legally two different addresses.

The point was to keep this component and the associated address data structure as **simple as possible**. At a future date an inclusive vision based completely on linked data and OSLO should be designed.

### Data binding

Ember 5 requires **unidirectional data bindings**. This means that the `@address` parameter needs to be supplied with a value (an object, more specifically) and the '@onChange' with an action handler.

The address search will accept any object but is really looking for a type `Partial<AddressSearchAddress>`. This means that for a 'new' form you can pass an empty object `{}` to it with no issues.

The handler function (action, more specifically) passed to the component receives a single parameter upon invocation of type `AddressSearchAddress | null`. If will receive a null when the address is still not complete.

Each time the user manipulates an input control the onChange function will be invoked. The controller of the template where the address search is used might incorporate code like this:

```javascript
@tracked
address = {}; // @address={{this.address}} in the component handlebars

handleChangeAddress(newAddress) { // @onChange={{this.handleChangeAddress}}
    this.address = newAddress;
}
```

It's important to remember that in ember 5 the component cannot alter `this.address` directly. You have to edit the handler function and update the address yourself.

In the case of CLB it's necessary to copy the results from the address search to ember data. For the edit form it's also necessary to convert a populated ember data record to the address schema.

How the component will react when the `@address` parameter constantly changes it yet untested. The manual mode dropdown boxes will not respond for sure. The component was never designed to be reactive to changes in address by means of an external logic but if you 'd have the component react reactively you have to make sure that whatever is linked to the parameter actually changes reference. `this.address.street = "New value"` will not make the component react to the change. But `this.address = {...this.address, street: "New value"}` will because a new reference is created.

### Manual mode: Provinces, postal names and postal codes

The manual mode for Flemish addresses has a special arrangement for filling in the trio of postal code, postal name (municipality) and province. All of these are strongly linked and the component will not allow the user to make a mistake and input an illegal of incorrect combination of the three.

Some postal names are identical to the name of a municipality, which makes it confusing. But the only correct address in Flanders contains a municipality and a postal code, NOT a postal name (although it is tolerated). The address search manual mode allows the user to use the postal name but will always output a correct address.

For example: The postal code 8370 in Flanders has two postal names associated with it: 'Blankenberge' and 'Uitkerke'. The associated municipality is Blankenberge.

This is an example of a correct address: `Fabiolapark 23, 8370 Blankenberge`\
This address is tolerated but not encouraged: `Fabiolapark 23, 8370 Uitkerke`

The address search component will always output the former, never the latter.

A single postal name such as 'Antwerpen' may also have multiple postcodes associated with it because this particular municipality has different districts. This is why you will find that filling in 'Antwerpen' in the postal name field is not sufficient. You'll have to specify the postal code as well.

### Validation

The component does have errorMessage and warningMessage attributes and they work. But this part is still under development.

Anyway if you use Joi to validate if the address is complete or not you could use this validation object (not tested).

```javascript
const addressSearchAddressCompletedValidation = Joi.object().keys({
  country: Joi.string(),
  province: Joi.string(),
  street: Joi.string(),
  houseNumber: Joi.string(),
  boxNumber: Joi.string().allow(null),
  municipality: Joi.string(),
  postalCode: Joi.string(),
  complete: Joi.boolean().optional(),
});
```
If the user has filled in everything correctly this will pass if (and only if!) the address is completely filled in.


