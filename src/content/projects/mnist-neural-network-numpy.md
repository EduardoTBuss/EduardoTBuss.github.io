---
project: mnist-neural-network-numpy
updated: "2026-09-03"
metrics:
  - label: Test accuracy on MNIST after 35 epochs
    value: "97-98%"
  - label: Training accuracy
    value: "98-99%"
  - label: Final training loss
    value: "0.07-0.10"
  - label: Architecture
    value: "784-64-32-10"
---

## Problem

Calling `model.fit` teaches you the API, not the method. Backpropagation in particular is
easy to recite and hard to actually hold: the chain rule is simple, but the shapes, the
ordering, the difference between what happens at training time and at inference time, and the
reason initialisation matters at all are exactly the parts a framework hides. I wanted the
gradients to be something I had derived and typed, not something imported.

## Approach

Write the whole network in NumPy: forward propagation, the loss, every gradient, the
parameter update, the regularisers. No autograd, no layers class hierarchy borrowed from a
framework, nothing that computes a derivative on my behalf. MNIST is the right target for
this because the dataset is not the difficulty, so any failure that appears is a failure in
the mathematics or in the implementation of it.

## Architecture

The network is a three-layer fully connected classifier, 784 inputs to 64 to 32 to 10
outputs, with ReLU on the hidden layers and softmax at the output paired with cross-entropy,
which is what makes the output-layer gradient collapse to the difference between prediction
and label; weights are initialised with the He scheme because ReLU halves the variance of the
activations and naive initialisation makes deep layers either saturate or vanish; the forward
pass caches each pre-activation so the backward pass can reuse it, gradients are averaged
over the mini-batch, and the two regularisers act in different places, dropout masking
activations during training only and L2 weight decay adding a term to the weight gradient;
training is plain mini-batch gradient descent with a fixed learning rate, saving the loss
curve after each epoch so divergence is visible while it happens rather than afterwards.

## Measured results

After 35 epochs at a learning rate of 0.006 with batches of 16, dropout of 0.1 on both hidden
layers and L2 weight decay of 0.001, the network reaches 97 to 98 percent accuracy on the
test set and 98 to 99 percent on the training set, with a final loss between 0.07 and 0.10.
The gap between the two accuracies is the visible effect of the regularisers: without them
the training accuracy climbs and the test accuracy does not follow. The repository also
renders correctly and incorrectly classified examples, which is where the residual errors
turn out to be the digits a person would also hesitate over.

## Engineering decisions

Deriving the softmax and cross-entropy gradient jointly, rather than composing two separate
derivatives, keeps the backward pass both simpler and numerically better behaved. Caching
pre-activations during the forward pass is what allows the backward pass to be a single
sweep. Keeping dropout explicitly conditional on training mode is a small thing that is easy
to get wrong and silently degrades inference. And keeping the whole model in one readable
file was deliberate: the point of the project is that someone can read it top to bottom and
see every equation.

## Limitations

MNIST is an easy dataset, and 98 percent on it is evidence that the implementation is
correct, not that the approach is good; nothing here transfers to a harder problem without
convolutions. TensorFlow appears in the requirements purely to download the dataset, which is
a wart on a project that advertises being framework-free. The optimiser is plain gradient
descent with a fixed learning rate, so there is no momentum, no schedule and no adaptive
method. There is no validation split, meaning the hyperparameters were chosen against the
test set, and there is no gradient check in the test suite, which is the one automated
verification a project like this should really have.

## Links

- Repository with the single-file implementation and the generated loss curves on GitHub.
