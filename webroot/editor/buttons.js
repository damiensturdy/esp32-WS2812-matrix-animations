function button(text,onclick) {
    const button = new Button(
        new Graphics()
            .beginFill(0xFFFFFF)
            .drawRoundedRect(0, 0, 100, 50, 15)
   );
  
   button.onPress.connect(() => onclick);
   return button;
}  